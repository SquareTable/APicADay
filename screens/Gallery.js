import {useState, useEffect} from 'react';
import {View, Text, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Keyboard, TouchableWithoutFeedback, Alert, AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Photo from '../components/Photo';
import { useIsFocused } from '@react-navigation/native';
import Circle from '../components/Circle';
import EncryptedStorage from 'react-native-encrypted-storage';
import Fontisto from 'react-native-vector-icons/Fontisto'

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

    useEffect(() => {

        async function getPhotos() {
            const keys = await AsyncStorage.getAllKeys()
            const data = await AsyncStorage.multiGet(keys)

            setPhotos(data)
        }

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
            if (nextAppState !== 'active') setLocked(true)
        });
    
        return () => {
          subscription.remove();
        };
    }, []);

    const deleteImage = (dateCreated) => {
        AsyncStorage.removeItem(dateCreated).then(() => {
            setPhotos(currentPhotos => {
                const index = currentPhotos.findIndex(item => item[0] === dateCreated)
                if (index === -1) {
                    alert('Could not find photo to delete')
                    return currentPhotos
                }

                const newPhotos = currentPhotos.slice()
                newPhotos.splice(index, 1)

                return newPhotos
            })
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

    return (
        <>
            {
                passwordIsSet !== null && photos !== null && locked !== null ?
                    locked ?
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View  style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Fontisto name="locked" size={60} color="black"/>
                                <Text style={{fontSize: 30, fontWeight: 'bold'}}>Gallery is locked</Text>
                                <TextInput style={{borderWidth: 1, width: 200, height: 25, marginTop: 10}} placeholder='Enter Password' placeholderTextColor={'black'} value={passwordText} onChangeText={setPasswordText} secureTextEntry/>
                                <Text style={{color: 'red', fontSize: 15, textAlign: 'center'}}>{unlockingError || ' '}</Text>
                                <TouchableOpacity onPress={unlockGallery} style={{borderWidth: 1, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 10}}>
                                    <Text style={{fontSize: 20, fontWeight: 'bold'}}>Unlock</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    : creatingPassword ?
                        processingPasswordGeneration ?
                            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <ActivityIndicator color="black" size="large"/>
                            </View>
                        :
                            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                    <Text style={{fontSize: 20}}>Create a Password</Text>
                                    <TextInput style={{borderWidth: 1, width: 200, height: 25, marginTop: 10}} placeholder='Enter a Password' placeholderTextColor={'black'} value={enterPassword} onChangeText={changeEnterPassword} secureTextEntry/>
                                    <TextInput style={{borderWidth: 1, width: 200, height: 25, marginTop: 10}} placeholder='Confirm Password' placeholderTextColor={'black'} value={confirmPassword} onChangeText={changeConfirmPassword} secureTextEntry/>
                                    <Text style={{color: 'red', fontSize: 15, textAlign: 'center'}}>{createPasswordError || ' '}</Text>
                                    <TouchableOpacity onPress={() => setCreatingPassword(false)} style={{borderWidth: 1, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 10}}>
                                        <Text style={{fontSize: 20, fontWeight: 'bold'}}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={setPassword} style={{borderWidth: 1, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 10}}>
                                        <Text style={{fontSize: 20, fontWeight: 'bold'}}>Save Password</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                    : photos.length ?
                        <SafeAreaView>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                <View style={{flexDirection: 'row'}}>
                                    <Circle width={14} color={passwordIsSet ? 'green' : 'red'} style={{marginLeft: 10}}/>
                                    <Text style={{fontSize: 14, marginLeft: 5}}>Password: {passwordIsSet ? 'ON' : 'OFF'}</Text>
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
                                keyExtractor={(item) => item[0]}
                                renderItem={({item}) => <Photo item={item} deleteImage={deleteImage}/>}
                                numColumns={2}
                                style={{width: '100%', height: '100%'}}
                            />
                        </SafeAreaView>
                    :
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{color: 'red', fontSize: 30, marginTop: 30}}>You have no photos.</Text>
                            <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                                <Circle width={15} color={passwordIsSet ? 'green' : 'red'}/>
                                <Text style={{fontSize: 15}}>{passwordIsSet ? 'Your gallery is protected with a password' : 'Your gallery does not have a password set'}</Text>
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 20}}>
                                {passwordIsSet ?
                                    <TouchableOpacity onPress={lockGallery}>
                                        <Text style={{fontSize: 16, color: 'blue', textDecorationStyle: 'solid', textDecorationColor: 'blue'}}>Lock Gallery</Text>
                                    </TouchableOpacity>
                                :
                                    <TouchableOpacity onPress={() => setCreatingPassword(true)}>
                                        <Text style={{fontSize: 16, color: 'blue', textDecorationStyle: 'solid', textDecorationColor: 'blue'}}>Turn on password</Text>
                                    </TouchableOpacity>
                                }
                            </View>
                        </View>
                :
                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                        <ActivityIndicator color="black" size="large"/>
                    </View>
            }
        </>
    )
}

export default Gallery;