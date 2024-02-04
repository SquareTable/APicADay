import {useState, useEffect} from 'react';
import {View, Text, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Keyboard, TouchableWithoutFeedback, Alert, AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Photo from '../components/Photo';
import { useIsFocused, useTheme } from '@react-navigation/native';
import Circle from '../components/Circle';
import EncryptedStorage from 'react-native-encrypted-storage';
import Fontisto from 'react-native-vector-icons/Fontisto'
import Ad from '../components/Ad';

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

    async function getPhotos() {
        let keys = await AsyncStorage.getAllKeys()
        keys = keys.filter((key) => key.slice(0, 6) === 'IMAGE-').map(item => item.substring(6))

        const originalLength = keys.length;

        const postsPerAd = 4; //This must be an even number

        const adsToShow = originalLength < postsPerAd + 1 ? 0 : Math.floor((originalLength - (postsPerAd + 1)) / postsPerAd + 1)

        keys.sort((a, b) => parseInt(b) - parseInt(a))

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

    const deleteImage = async (dateCreated) => {
        const dateCreatedDateObject = new Date(parseInt(dateCreated))
        const currentDate = new Date();

        if (currentDate.getDate() === dateCreatedDateObject.getDate() && currentDate.getMonth() === dateCreatedDateObject.getMonth() && currentDate.getFullYear() === dateCreatedDateObject.getFullYear()) {
            //Photo was taken today so take away one from the streak
            let streakCount;
            try {
                const streak = parseInt(await AsyncStorage.getItem('current-streak'))
                if (isNaN(streak)) {
                    streakCount = 0
                } else {
                    streakCount = streak - 1
                }
            } catch (error) {
                console.error(error)
                alert('An error occurred while deleting item.')
            }

            try {
                await AsyncStorage.setItem('current-streak', String(streakCount))
            } catch (error) {
                console.error(error)
                alert('An error occurred while deleting photo.')
            }
        }

        if (photos.length === 1) {
            //The user is deleting the last image, so remove the streak
            await AsyncStorage.removeItem('current-streak')
        }

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

    const calculateStreak = async () => {
        let returnValue;

        await Promise.all([
            AsyncStorage.getItem('current-streak'),
            AsyncStorage.getItem('previous-streak-date-ms')
        ]).then(async ([currentStreak, previousStreakTime]) => {
            let currentStreakCount = currentStreak ? parseInt(currentStreak) : 0
            const previousStreakDateObject = new Date(parseInt(previousStreakTime))

            const currentDate = new Date();
            const yesterdayDate = new Date(currentDate.getTime() - 1000 * 60 * 60 * 24)

            const photoTakenToday = currentDate.getDate() === previousStreakDateObject.getDate() && currentDate.getMonth() === previousStreakDateObject.getMonth() && currentDate.getFullYear() === previousStreakDateObject.getFullYear()
            const streakWarning = yesterdayDate.getDate() === previousStreakDateObject.getDate() && yesterdayDate.getMonth() === previousStreakDateObject.getMonth() && yesterdayDate.getFullYear() === previousStreakDateObject.getFullYear()

            if (!photoTakenToday && !streakWarning) {
                //Photo was not taken today or yesterday o streak has ended
                try {
                    await AsyncStorage.setItem('current-streak', '0')
                } catch (error) {
                    console.error(error)
                    returnValue = [true]
                }

                returnValue = [false, 0, false, false]
            }

            returnValue = [false, currentStreakCount, streakWarning, photoTakenToday]
        }).catch(error => {
            console.error(error)
            returnValue = [true]
        })

        return returnValue;
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
                    : photos.length ?
                        <SafeAreaView style={{flex: 1}}>
                            {passwordIsSet && (
                                <TouchableOpacity onPress={lockGallery} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10}}>
                                    <Fontisto name="locked" size={20} color={colors.link}/>
                                    <Text style={{fontSize: 16, color: colors.link, textDecorationStyle: 'solid', textDecorationColor: colors.link, marginLeft: 10}}>Lock Gallery</Text>
                                </TouchableOpacity>
                            )}
                            <FlatList
                                data={photos}
                                keyExtractor={(item) => item.key || item}
                                renderItem={({item}) => item.ad === true ? <Ad/> : item.ad === 'placeholder' ? null : <Photo item={item} deleteImage={deleteImage} colors={colors}/>}
                                numColumns={2}
                                ListHeaderComponent={
                                    <>
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