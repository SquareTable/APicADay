import {useState, useEffect} from 'react';
import {View, Text, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Keyboard, TouchableWithoutFeedback, Alert, AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Photo from '../components/Photo';
import { useIsFocused, useTheme } from '@react-navigation/native';
import Circle from '../components/Circle';
import EncryptedStorage from 'react-native-encrypted-storage';
import Fontisto from 'react-native-vector-icons/Fontisto'
import { AdIdContext } from '../context/AdIdContext';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import Ad from '../components/Ad';

const Gallery = () => {
    const [photos, setPhotos] = useState(null)
    const isFocused = useIsFocused();
    const [passwordIsSet, setPasswordIsSet] = useState(null)
    const [locked, setLocked] = useState(null)
    const [creatingPassword, setCreatingPassword] = useState(false)
    const [enterPassword, changeEnterPassword] = useState('')
    const [confirmPassword, changeConfirmPassword] = useState('')
    const [createPasswordError, setCreatePasswordError] = useState(null)
    const [processingPasswordGeneration, setProcessingPasswordGeneration] = useState(false)
    const [passwordText, setPasswordText] = useState('')
    const [unlockingError, setUnlockingError] = useState(null)
    const { colors } = useTheme();
    const [streak, setStreak] = useState(0)
    const [streakWarning, setStreakWarning] = useState(false)

    async function getPhotos() {
        const keys = await AsyncStorage.getAllKeys()
        const data = await AsyncStorage.multiGet(keys)

        const originalLength = data.length;

        const postsPerAd = 4; //This must be an even number

        const adsToShow = originalLength < postsPerAd + 1 ? 0 : Math.floor((originalLength - (postsPerAd + 1)) / postsPerAd + 1)

        data.sort(([a], [b]) => parseInt(b) - parseInt(a))

        for (let i = 0; i < adsToShow; i++) {
            //The first ad will be placed after the first 4 ads
            //Every other ad will be placed 4 pictures after (2nd ad will be after 8th image, 3rd will be after 12th image)
            //Since 2 ad items get added to the array, we need to offset the index by 2 (to ignore the ad spaces) and offset by 4 (to place an ad after every 4 pictures)
            //The FlatList that displays the images has numColumns set to 2 (the FlatList displays 2 columns)
            //Because of that, we add 2 ad items to the array, but we are only going to be displaying one ad
            //The 2nd ad item is to prevent an image not getting shown in the list because numColumns is set to 2

            data.splice(postsPerAd + (postsPerAd + 2) * i, 0, {ad: true, key: `AD-${i}`}, {ad: 'placeholder', key: `AD-PLACEHOLDER-${i}`})
        }

        const [streak, streakWarning] = calculateStreak(data)
        setStreak(streak)
        setStreakWarning(streakWarning)
        setPhotos(data)
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
            getPhotos()
            getIsPasswordSet()
        } else {
            if (passwordIsSet) setLocked(true)
        }
    }, [isFocused])

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

    const deleteImage = (dateCreated) => {
        AsyncStorage.removeItem(dateCreated).then(() => {
            getPhotos()
        }).catch(error => {
            console.error(error)
            alert('An error occurred while removing item.')
        })
    }

    const setPassword = async () => {
        setCreatePasswordError(null)
        setProcessingPasswordGeneration(true)

        if (enterPassword !== confirmPassword) {
            setProcessingPasswordGeneration(false)
            return setCreatePasswordError('Passwords do not match')
        }

        if (enterPassword.length < 8) {
            setProcessingPasswordGeneration(false)
            return setCreatePasswordError('Password must be longer than 8 characters')
        }

        if (enterPassword.length > 17) {
            setProcessingPasswordGeneration(false)
            return setCreatePasswordError('Due to current limitations, the password cannot be more than 17 characters')
        }

        try {
            await EncryptedStorage.setItem('app-password', enterPassword)
            setPasswordIsSet(true)
            setProcessingPasswordGeneration(false)
            setCreatingPassword(false)
            changeEnterPassword('')
            changeConfirmPassword('')
        } catch (error) {
            setProcessingPasswordGeneration(false)
            setCreatePasswordError('An error occurred:', error)
        }
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

    const removePassword = async () => {
        try {
            await EncryptedStorage.removeItem('app-password')
            setPasswordIsSet(false)
        } catch (error) {
            console.error(error)
            alert('An error occurred while removing password')
        }
    }

    const calculateStreak = (sortedPhotos) => {
        let dateToCheckAgainst = new Date();
        const msInDay = 24 * 60 * 60 * 1000;
        let streakCount = 0;
        let streakWarning = false;
        let photosIterated = 0;

        const currentDate = dateToCheckAgainst.getDate();
        const currentMonth = dateToCheckAgainst.getMonth();
        const currentYear = dateToCheckAgainst.getFullYear();

        for (const [photoDateMS] of sortedPhotos) {
            photosIterated++;

            const photoDate = new Date(parseInt(photoDateMS));
            const photoYearTaken = photoDate.getFullYear();
            const photoMonthTaken = photoDate.getMonth();
            const photoDateTaken = photoDate.getDate();

            if (photoDateTaken === currentDate && photoMonthTaken === currentMonth && photoYearTaken === currentYear) {
                streakCount++;
                continue;
            }

            dateToCheckAgainst = new Date(dateToCheckAgainst.getTime() - msInDay)

            const dateToCheckAgainstDate = dateToCheckAgainst.getDate();
            const dateToCheckAgainstMonth = dateToCheckAgainst.getMonth();
            const dateToCheckAgainstYear = dateToCheckAgainst.getFullYear();

            if (photosIterated === 1 && dateToCheckAgainstDate === photoDateTaken && dateToCheckAgainstMonth === photoMonthTaken && dateToCheckAgainstYear === photoYearTaken) {
                //If the most recent photo was taken yesterday
                streakWarning = true;
            }

            if (photoYearTaken === dateToCheckAgainstYear && dateToCheckAgainstMonth === photoMonthTaken && dateToCheckAgainstDate === photoDateTaken) {
                streakCount++;
                continue;
            }

            break
        }

        return [streakCount, streakWarning]
    }

    return (
        <>
            {
                passwordIsSet !== null && photos !== null && locked !== null ?
                    locked ?
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Fontisto name="locked" size={60} color={colors.text}/>
                                <Text style={{fontSize: 30, fontWeight: 'bold', color: colors.text}}>Gallery is locked</Text>
                                <TextInput style={{borderWidth: 1, width: 200, height: 30, marginTop: 10, color: colors.text, borderColor: colors.text, paddingLeft: 5, borderRadius: 5}} placeholder='Enter Password' placeholderTextColor={colors.text} value={passwordText} onChangeText={setPasswordText} secureTextEntry/>
                                <Text style={{color: 'red', fontSize: 15, textAlign: 'center'}}>{unlockingError || ' '}</Text>
                                <TouchableOpacity onPress={unlockGallery} style={{borderWidth: 1, borderColor: colors.text, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 10}}>
                                    <Text style={{fontSize: 20, fontWeight: 'bold', color: colors.text}}>Unlock</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    : creatingPassword ?
                        processingPasswordGeneration ?
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <ActivityIndicator color={colors.text} size="large"/>
                            </View>
                        :
                            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                    <Text style={{fontSize: 20, color: colors.text}}>Create a Password</Text>
                                    <TextInput style={{borderWidth: 1, width: 200, height: 30, marginTop: 10, color: colors.text, borderColor: colors.text, paddingLeft: 5, borderRadius: 5}} placeholder='Enter a Password' placeholderTextColor={colors.text} value={enterPassword} onChangeText={changeEnterPassword} secureTextEntry/>
                                    <TextInput style={{borderWidth: 1, width: 200, height: 30, marginTop: 10, color: colors.text, borderColor: colors.text, paddingLeft: 5, borderRadius: 5}} placeholder='Confirm Password' placeholderTextColor={colors.text} value={confirmPassword} onChangeText={changeConfirmPassword} secureTextEntry/>
                                    <Text style={{color: 'red', fontSize: 15, textAlign: 'center'}}>{createPasswordError || ' '}</Text>
                                    <TouchableOpacity onPress={() => setCreatingPassword(false)} style={{borderWidth: 1, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 10, borderColor: colors.text}}>
                                        <Text style={{fontSize: 20, fontWeight: 'bold', color: colors.text}}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={setPassword} style={{borderWidth: 1, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 10, borderColor: colors.text}}>
                                        <Text style={{fontSize: 20, fontWeight: 'bold', color: colors.text}}>Save Password</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                    : photos.length ?
                        <SafeAreaView style={{flex: 1}}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10}}>
                                <View style={{flexDirection: 'row'}}>
                                    <Circle width={14} color={passwordIsSet ? 'green' : 'red'} style={{marginLeft: 10}}/>
                                    <Text style={{fontSize: 14, marginLeft: 5, color: colors.text}}>Password: {passwordIsSet ? 'ON' : 'OFF'}</Text>
                                </View>
                                <View>
                                    {passwordIsSet ?
                                        <TouchableOpacity onPress={removePassword}>
                                            <Text style={{fontSize: 14, color: 'blue', textDecorationStyle: 'solid', textDecorationColor: 'blue'}}>Remove Password</Text>
                                        </TouchableOpacity>
                                    :
                                        <TouchableOpacity onPress={() => setCreatingPassword(true)}>
                                            <Text style={{fontSize: 14, color: 'blue', textDecorationStyle: 'solid', textDecorationColor: 'blue', marginRight: 10}}>Turn on password</Text>
                                        </TouchableOpacity>
                                    }
                                </View>
                            </View>
                            {passwordIsSet && (
                                <TouchableOpacity onPress={lockGallery} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                                    <Fontisto name="locked" size={20} color="blue"/>
                                    <Text style={{fontSize: 16, color: 'blue', textDecorationStyle: 'solid', textDecorationColor: 'blue', marginLeft: 10}}>Lock Gallery</Text>
                                </TouchableOpacity>
                            )}
                            <FlatList
                                data={photos}
                                keyExtractor={(item) => item.key || item[0]}
                                renderItem={({item}) => item.ad === true ? <Ad/> : item.ad === 'placeholder' ? null : <Photo item={item} deleteImage={deleteImage} colors={colors}/>}
                                numColumns={2}
                                ListHeaderComponent={
                                    <>
                                        <View style={{width: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                                            <Text style={{color: colors.text}}>🔥 Your streak is: {streak}</Text>
                                            {streakWarning && <Text style={{color: 'red'}}>Take a photo today to avoid losing your streak</Text>}
                                        </View>
                                    </>
                                }
                            />
                        </SafeAreaView>
                    :
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{fontSize: 30, marginTop: 30, color: colors.text}}>You have no photos.</Text>
                            <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                                <Circle width={15} color={passwordIsSet ? 'green' : 'red'}/>
                                <Text style={{fontSize: 15, color: colors.text}}>{passwordIsSet ? 'Your gallery is protected with a password' : 'Your gallery does not have a password set'}</Text>
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 20}}>
                                {passwordIsSet ?
                                    <>
                                        <TouchableOpacity onPress={lockGallery}>
                                            <Text style={{fontSize: 20, color: 'blue', textDecorationStyle: 'solid', textDecorationColor: 'blue'}}>Lock Gallery</Text>
                                        </TouchableOpacity>
                                    </>
                                :
                                    <TouchableOpacity onPress={() => setCreatingPassword(true)}>
                                        <Text style={{fontSize: 20, color: 'blue', textDecorationStyle: 'solid', textDecorationColor: 'blue'}}>Turn on password</Text>
                                    </TouchableOpacity>
                                }
                            </View>
                            {passwordIsSet && (
                                <TouchableOpacity onPress={removePassword}>
                                    <Text style={{fontSize: 20, color: 'blue', textDecorationStyle: 'solid', textDecorationColor: 'blue', marginTop: 25}}>Remove Password</Text>
                                </TouchableOpacity>
                            )}
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