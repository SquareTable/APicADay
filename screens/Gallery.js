import {useState, useEffect, useRef} from 'react';
import {View, Text, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Keyboard, TouchableWithoutFeedback, Alert, AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Photo from '../components/Photo';
import { useIsFocused, useTheme } from '@react-navigation/native';
import Circle from '../components/Circle';
import EncryptedStorage from 'react-native-encrypted-storage';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Octicons from 'react-native-vector-icons/Octicons';
import Ad from '../components/Ad';
import Button from '../components/Button';
import DatePicker from 'react-native-date-picker';
import { localizeShortDate } from '../utils/DateHelper';

const Gallery = ({navigation}) => {
    const [photos, setPhotos] = useState(null)
    const isFocused = useIsFocused();
    const [passwordIsSet, setPasswordIsSet] = useState(null)
    const [locked, setLocked] = useState(null)
    const [passwordText, setPasswordText] = useState('')
    const [unlockingError, setUnlockingError] = useState(null)
    const { colors } = useTheme();
    const [streak, setStreak] = useState(0)
    const [streakWarning, setStreakWarning] = useState(false)
    const [photoTakenToday, setPhotoTakenToday] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [startDate, setStartDate] = useState(null)
    const [endDate, setEndDate] = useState(null)
    const [searchActive, setSearchActive] = useState(false)
    const [startDateSelectorOpen, setStartDateSelectorOpen] = useState(false);
    const [endDateSelectorOpen, setEndDateSelectorOpen] = useState(false);
    const [searching, setSearching] = useState(false);
    const previousStartDate = useRef(null);
    const previousEndDate = useRef(null);

    async function getPhotos() {
        let keys = await AsyncStorage.getAllKeys()
        keys = keys.filter((key) => key.slice(0, 6) === 'IMAGE-').map(item => parseInt(item.substring(6)))

        if (searchActive) {
            const startMilliseconds = startDate.getTime();
            const endMilliseconds = endDate.getTime();

            keys = keys.filter(key => {
                return startMilliseconds <= key && key <= endMilliseconds
            })
        }

        const originalLength = keys.length;

        const postsPerAd = 4; //This must be an even number

        const adsToShow = originalLength < postsPerAd + 1 ? 0 : Math.floor((originalLength - (postsPerAd + 1)) / postsPerAd + 1)

        keys.sort((a, b) => b - a)

        for (let i = 0; i < adsToShow; i++) {
            //The first ad will be placed after the first 4 ads
            //Every other ad will be placed 4 pictures after (2nd ad will be after 8th image, 3rd will be after 12th image)
            //Since 2 ad items get added to the array, we need to offset the index by 2 (to ignore the ad spaces) and offset by 4 (to place an ad after every 4 pictures)
            //The FlatList that displays the images has numColumns set to 2 (the FlatList displays 2 columns)
            //Because of that, we add 2 ad items to the array, but we are only going to be displaying one ad
            //The 2nd ad item is to prevent an image not getting shown in the list because numColumns is set to 2

            keys.splice(postsPerAd + (postsPerAd + 2) * i, 0, {ad: true, key: `AD-${i}`}, {ad: 'placeholder', key: `AD-PLACEHOLDER-${i}`})
        }

        const [error, streak, streakWarning, photoTakenToday] = await calculateStreak()

        if (!error) {
            setStreak(streak)
            setStreakWarning(streakWarning)
            setPhotoTakenToday(photoTakenToday)
        } else {
            setStreak('ERROR')
        }
        
        if (searching) {
            setSearching(false)
        }

        setPhotos(keys)
    }

    useEffect(() => {
        async function getIsPasswordSet() {
            try {
                const password = await EncryptedStorage.getItem("app-password");
                setPasswordIsSet(!!password)
                setLocked(!!password)
            } catch (error) {
                console.error(error)
                Alert.alert('An error occurred', String(error), [
                {
                    text: 'Cancel',
                    onPress: () => console.log('Cancel Pressed'),
                    style: 'cancel',
                },
                {text: 'Retry', onPress: getIsPasswordSet},
                ]);
            }
        }

        if (isFocused) {
            getIsPasswordSet()
        } else {
            if (passwordIsSet) setLocked(true)
        }
    }, [isFocused])

    useEffect(() => {
        if (isFocused) {
            if (!searchActive || (startDate && endDate)) {
                getPhotos();
            }
        }
    }, [isFocused, searchActive, startDate, endDate, searching])

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState !== 'active' && passwordIsSet) {
                setLocked(true)
            }
        });
    
        return () => {
            console.log('Removing AppState listener on Gallery.js')
            subscription.remove();
        };
    }, [passwordIsSet]);

    const deleteImage = async (dateCreated) => {
        AsyncStorage.removeItem('IMAGE-' + dateCreated).then(() => {
            getPhotos()
        }).catch(error => {
            console.error(error)
            alert('An error occurred while removing item.')
        })
    }

    const lockGallery = () => {
        setLocked(true)
    }

    const unlockGallery = async () => {
        setUnlockingError('')
        try {
            const storedPassword = await EncryptedStorage.getItem('app-password')
            if (storedPassword === passwordText) {
                setLocked(false)
                setPasswordText('')
            } else {
                setUnlockingError('Wrong password')
                setPasswordText('')
            }
        } catch(error) {
            console.error(error)
            setUnlockingError('An error occurred:' + error)
            setPasswordText('')
        }
    }

    function getDaysSinceUnixEpoch(ms) {
        return Math.floor(ms / (1000 * 60 * 60 * 24))
    }

    function daysDifference(dateMsOne, dateMsTwo) {
        return getDaysSinceUnixEpoch(dateMsOne) - getDaysSinceUnixEpoch(dateMsTwo)
    }

    const calculateStreak = async () => {
        //The streak incorrectly includes future dates, but since the user should not have their clock set to the future and change it back to the present, this bug will be ignored.
        //This could easily be resolved in the future but would require extra compute. I would rather use less compute and include future dates than check for future dates.

        let streak = 0;
        let keys;

        try {
            keys = await AsyncStorage.getAllKeys()
        } catch (error) {
            console.error(error)
            return [true]
        }

        keys = keys.filter((key) => key.slice(0, 6) === 'IMAGE-');

        if (keys.length === 0) {
            return [false, 0, false, false]
        }


        keys = keys.map(item => parseInt(item.substring(6))).sort((a, b) => b - a);

        const dayDifferenceFromFirstPhoto = daysDifference(Date.now(), keys[0])
        const photoTakenToday = dayDifferenceFromFirstPhoto === 0;
        const streakWarning = dayDifferenceFromFirstPhoto === 1;

        if (keys.length === 1) {
            const difference = daysDifference(Date.now(), keys[0]);
            const streak = difference === 0 || difference === 1 ? 1 : 0
            return [false, streak, streakWarning, photoTakenToday]
        }

        if (dayDifferenceFromFirstPhoto > 1) return [false, 0, false, false]

        streak++

        for (let i = 0; i < keys.length - 1; i++) {
            const dates = keys.slice(i, i + 2);
            if (daysDifference(...dates) === 1) {
                streak++
                continue
            }

            break
        }

        return [false, streak, streakWarning, photoTakenToday]
    }

    function startSearching() {
        if (!endDate || !startDate) return alert('Please enter a start and an end date')
        setSearchActive(true)
        setSearchOpen(false)
        setSearching(true);
        previousStartDate.current = startDate;
        previousEndDate.current = endDate;
    }

    function cancelSearch(resetDate) {
        setSearchOpen(false)

        if (startDate !== previousStartDate.current) {
            setStartDate(previousStartDate.current)
        }

        if (endDate !== previousEndDate.current) {
            setEndDate(previousEndDate.current)
        }

        if (resetDate) {
            setStartDate(null)
            setEndDate(null)
            setSearchActive(false)
            setSearching(true)
        }
    }

    return (
        <>
            <DatePicker
                modal
                open={startDateSelectorOpen}
                date={startDate === null ? new Date() : startDate}
                onConfirm={(date) => {
                    setStartDateSelectorOpen(false)

                    if (date.getTime() > Date.now()) {
                        date = new Date();
                    }

                    date.setHours(0)
                    date.setMinutes(0)
                    date.setSeconds(0, 0)
                    setStartDate(date)
                }}
                onCancel={() => {
                    setStartDateSelectorOpen(false)
                }}
                mode="date"
                maximumDate={new Date()}
            />
            <DatePicker
                modal
                open={endDateSelectorOpen}
                date={endDate === null ? new Date() : endDate}
                onConfirm={(date) => {
                    setEndDateSelectorOpen(false)
                    
                    if (date.getTime() > Date.now()) {
                        date = new Date();
                    }

                    date.setHours(23)
                    date.setMinutes(59)
                    date.setSeconds(59, 999)
                    setEndDate(date)
                }}
                onCancel={() => {
                    setEndDateSelectorOpen(false)
                }}
                mode="date"
                maximumDate={new Date()}
                minimumDate={startDate === null ? new Date() : startDate}
            />

            {
                passwordIsSet !== null && photos !== null && locked !== null ?
                    locked ?
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Fontisto name="locked" size={60} color={colors.text}/>
                                <Text style={{fontSize: 30, fontWeight: 'bold', color: colors.text}}>Gallery is locked</Text>
                                <TextInput style={{borderWidth: 1, width: 200, height: 35, marginTop: 10, color: colors.text, borderColor: colors.text, paddingLeft: 5, borderRadius: 5}} placeholder='Enter Password' placeholderTextColor={colors.text} value={passwordText} onChangeText={setPasswordText} secureTextEntry/>
                                <Text style={{color: 'red', fontSize: 15, textAlign: 'center'}}>{unlockingError || ' '}</Text>
                                <Button onPress={unlockGallery} text="Unlock"/>
                            </View>
                        </TouchableWithoutFeedback>
                    : searchOpen ?
                        <SafeAreaView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', width: '100%', marginBottom: 30}}>
                                <View>
                                    <Text style={{fontSize: 16, color: colors.text, fontWeight: 'bold', textAlign: 'center'}}>Start Date</Text>
                                    <Text style={{fontSize: 16, color: colors.text, fontWeight: 'bold', textAlign: 'center'}}>{startDate === null ? 'Not Set' : localizeShortDate(startDate)}</Text>
                                    <Button onPress={() => setStartDateSelectorOpen(true)} text={startDate === null ? 'Set Date' : 'Change'} textStyle={{fontSize: 16}}/>
                                </View>
                                <View>
                                    <Text style={{fontSize: 16, color: colors.text, fontWeight: 'bold', textAlign: 'center'}}>End Date</Text>
                                    <Text style={{fontSize: 16, color: colors.text, fontWeight: 'bold', textAlign: 'center'}}>{endDate === null ? 'Not Set' : localizeShortDate(endDate)}</Text>
                                    <Button active={!!startDate} onPress={() => startDate ? setEndDateSelectorOpen(true) : alert('Please set a start date first')} text={endDate === null ? 'Set Date' : 'Change'} textStyle={{fontSize: 16}}/>
                                </View>
                            </View>
                            <Text style={{fontSize: 20, fontWeight: 'bold', textAlign: 'center', color: colors.text}}>Days to search: {!startDate || !endDate ? 0 : Math.floor((endDate / 1000 / 60 / 60 / 24) - (startDate / 1000 / 60 / 60 / 24))}</Text>
                            <Button onPress={() => cancelSearch(!searchActive)} text="Cancel"/>
                            <Button active={!!startDate && !!endDate} onPress={startSearching} text="Search"/>
                        </SafeAreaView>
                    : searching ?
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <ActivityIndicator size="large" color={colors.text}/>
                        </View>
                    : searchActive && photos.length === 0 ?
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{fontSize: 20, color: colors.text, textAlign: 'center'}}>Search for photos taken between {localizeShortDate(startDate)} - {localizeShortDate(endDate)} returned no photos.</Text>
                            <TouchableOpacity style={{marginTop: 20}} onPress={() => cancelSearch(true)}>
                                <Text style={{fontSize: 20, color: colors.link, textAlign: 'center'}}>Clear Search</Text>
                            </TouchableOpacity>
                        </View>
                    : photos.length ?
                        <SafeAreaView style={{flex: 1}}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                <TouchableOpacity style={{paddingHorizontal: 10}} disabled={true}>
                                    {/*FUNCTIONALITY COMING SOON! TOUCHABLEOPACITY IS MEANT TO BE DISABLED!*/}
                                    <Octicons name="video" size={30} color={colors.background}/>
                                </TouchableOpacity>
                                {passwordIsSet ? (
                                    <TouchableOpacity onPress={lockGallery} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10, alignSelf: 'center'}}>
                                        <Fontisto name="locked" size={20} color={colors.link}/>
                                        <Text style={{fontSize: 16, color: colors.link, textDecorationStyle: 'solid', textDecorationColor: colors.link, marginLeft: 10}}>Lock Gallery</Text>
                                    </TouchableOpacity>
                                ) : <View/>}
                                <TouchableOpacity onPress={() => setSearchOpen(true)} style={{paddingHorizontal: 10}}>
                                    <Fontisto name="search" size={30} color={colors.text}/>
                                </TouchableOpacity>
                            </View>
                            {
                                searchActive && (
                                    <>
                                        <Text style={{fontSize: 14, textAlign: 'center', color: colors.text}}>Active Search: {localizeShortDate(startDate)} - {localizeShortDate(endDate)}</Text>
                                        <TouchableOpacity style={{paddingBottom: 5}} onPress={() => cancelSearch(true)}>
                                            <Text style={{fontSize: 16, color: colors.link, textAlign: 'center'}}>Clear Search</Text>
                                        </TouchableOpacity>
                                    </>
                                )
                            }
                            <FlatList
                                data={photos}
                                keyExtractor={(item) => item.key || item}
                                renderItem={({item}) => item.ad === true ? <Ad/> : item.ad === 'placeholder' ? null : <Photo item={item} deleteImage={deleteImage} colors={colors}/>}
                                numColumns={2}
                                ListHeaderComponent={
                                    <>
                                        {!searchActive && (
                                            <View style={{width: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                                                <Text style={{color: colors.text}}>🔥 Your streak is: {streak}</Text>
                                                {streakWarning ? 
                                                    <Text style={{color: 'red'}}>Take a photo today to avoid losing your streak</Text>
                                                : photoTakenToday ?
                                                    <Text style={{color: colors.text}}>You've added to your streak for today</Text>
                                                :
                                                    <Text style={{color: colors.text}}>Take a photo everyday to build up your streak!</Text>
                                                }
                                            </View>
                                        )}
                                    </>
                                }
                            />
                        </SafeAreaView>
                    :
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{fontSize: 30, color: colors.text}}>You have no photos.</Text>
                            <Text style={{fontSize: 14, marginVertical: 30, color: colors.text, textAlign: 'center'}}>When you take photos in APicADay, they will show up here.</Text>
                            <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                                <Circle width={15} color={passwordIsSet ? 'green' : 'red'}/>
                                <Text style={{fontSize: 15, color: colors.text}}>{passwordIsSet ? 'Your gallery is protected with a password' : "Your gallery doesn't have a password set"}</Text>
                            </View>
                            {
                                !passwordIsSet && (
                                    <View style={{flexDirection: 'row', marginTop: 30}}>
                                        <Text style={{fontSize: 16, color: colors.text}}>You can set a password for your gallery in </Text>
                                        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                                            <Text style={{fontSize: 16, color: colors.link}}>Settings</Text>
                                        </TouchableOpacity>
                                    </View>
                                )
                            }
                        </View>
                :
                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                        <ActivityIndicator color={colors.text} size="large"/>
                    </View>
            }
        </>
    )
}

export default Gallery;