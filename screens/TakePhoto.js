import {useState, useEffect, useRef} from 'react';
import {View, Text, Linking, TouchableOpacity, StyleSheet, ActivityIndicator, AppState, Platform} from 'react-native';
import { Camera, useCameraDevice, useCameraDevices } from 'react-native-vision-camera';
import { useIsFocused, useTheme } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';


const TakePhoto = () => {
    const [cameraPermission, setCameraPermission] = useState()
    const frontDevice = useCameraDevice('front')
    //If the wideAngleCamera could be found, use that (since generally it has the best quality) otherwise use any back camera
    const backDevice = useCameraDevice('back')
    const focused = useIsFocused();
    const camera = useRef();
    const [takenPhotoToday, setTakenPhotoToday] = useState(null)
    const [flashOn, setFlashOn] = useState(false);
    const [chosenCamera, setChosenCamera] = useState('back')
    const { colors } = useTheme()
    const frontAndBackEnabled = frontDevice && backDevice ? true : false;
    const device = frontAndBackEnabled ? chosenCamera === 'front' ? frontDevice : backDevice : frontDevice || backDevice;
    const [photoJustTaken, setPhotoJustTaken] = useState(false);

    const setupTakePhotoScreen = async () => {
        const status = await Camera.getCameraPermissionStatus()
        if (status === 'granted') {
            const keys = await AsyncStorage.getAllKeys()

            const now = new Date()

            const index = keys.findIndex(key => {
                //key is "IMAGE-" + createdAt
                if (key.slice(0, 6) !== 'IMAGE-') return false

                const createdDate = new Date(parseInt(key.substring(6)))

                if (createdDate.getFullYear() !== now.getFullYear()) {
                    return false
                }

                if (createdDate.getMonth() !== now.getMonth()) {
                    return false
                }

                if (createdDate.getDate() !== now.getDate()) {
                    return false
                }

                return true
            })

            setTakenPhotoToday(index !== -1)
            setPhotoJustTaken(false)
        }
        setCameraPermission(status)
    }


    useEffect(() => {
        setupTakePhotoScreen()
    }, [focused])

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                setupTakePhotoScreen()
            }
        });
    
        return () => {
            console.log('Removing AppState listener on TakePhoto.js')
            subscription.remove();
        };
    }, []);

    const openSettings = async () => {
        await Linking.openSettings();
    }

    const allowCameraAccess = async () => {
        setCameraPermission(await Camera.requestCameraPermission())
    }

    const takePhoto = async () => {
        const photo = await camera.current.takePhoto({
            flash: !device.hasFlash ? 'off' : flashOn ? 'on' : 'off',
            qualityPrioritization: 'speed'
        })

        const nowMs = Date.now()
        const base64 = await RNFS.readFile(photo.path, 'base64');
        AsyncStorage.setItem(('IMAGE-' + nowMs), JSON.stringify({base64Image: base64})).then(() => {
            RNFS.unlink(photo.path)
            .then(() => {
                console.log('File deleted');
                setTakenPhotoToday(true)
                setPhotoJustTaken(true)
            })
            .catch((err) => {
                console.error(err.message);
                alert('An error occurred:' + err.message)
            });
        }).catch(error => {
            alert('An error occurred while saving:' + error)
            console.error(error)
        })
    }

    const changeCamera = () => {
        setChosenCamera(chosenCamera => chosenCamera === 'front' ? 'back' : 'front')
    }
  

    return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            {
                cameraPermission == undefined ?
                    <ActivityIndicator size="large" color={colors.text}/>
                : cameraPermission === "granted" ?
                    !frontDevice && !backDevice ?
                        <Text style={{fontSize: 24, textAlign: 'center', fontWeight: 'bold', marginHorizontal: 10, color: colors.text}}>Could not find a camera device to use.</Text>
                    : photoJustTaken ?
                        <Text style={{fontSize: 30, textAlign: 'center', color: colors.text}}>Your photo has been successfully saved. Come back tomorrow to take another one!</Text>
                    : takenPhotoToday ?
                        <Text style={{fontSize: 30, textAlign: 'center', color: colors.text}}>You have already taken a photo today. Please come back tomorrow.</Text>
                    :
                        device == null ?
                            <ActivityIndicator size="large" color={colors.text}/>
                        :
                            <>
                                <View style={{position: 'absolute', zIndex: 2, top: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', height: '100%', width: '100%', paddingBottom: 20}}>
                                    {frontAndBackEnabled && (
                                        <TouchableOpacity onPress={changeCamera} style={{position: 'absolute', left: 10, bottom: 20}}>
                                            <Ionicons name="camera-reverse-sharp" size={70} color="white" style={styles.dropShadow}/>
                                        </TouchableOpacity>
                                    )}
                                    {device.hasFlash && (
                                        <TouchableOpacity onPress={() => setFlashOn(flashOn => !flashOn)} style={{position: 'absolute', right: 10, bottom: 20}}>
                                            <Ionicons name={flashOn ? 'flash' : 'flash-off'} size={70} color="white" style={styles.dropShadow}/>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity onPress={takePhoto} style={[{backgroundColor: 'black', width: 70, height: 70, borderColor: 'white', borderWidth: 2, borderRadius: 1000}, styles.dropShadow]}></TouchableOpacity>
                                </View>
                                <Camera
                                    style={{height: '100%', width: '100%'}}
                                    device={device}
                                    isActive={focused}
                                    photo={true}
                                    ref={camera}
                                />
                            </>
                : cameraPermission === "not-determined" ?
                    <>
                        <Text style={{fontSize: 30, textAlign: 'center', color: colors.text}}>To start taking photos, press the "Continue" button to allow camera usage.</Text>
                        <TouchableOpacity onPress={allowCameraAccess} style={{paddingHorizontal: 20, paddingVertical: 10, borderColor: colors.text, borderWidth: 2, borderRadius: 10}}>
                            <Text style={{fontSize: 30, textAlign: 'center', color: colors.text}}>Continue</Text>
                        </TouchableOpacity>
                    </>
                : cameraPermission === "denied" ?
                    <>
                        <Text style={{fontSize: 30, textAlign: 'center', color: colors.text, marginBottom: 10}}>Camera usage for APicADay has been denied in your system settings. Please enable them to be able to use APicADay.</Text>
                        <TouchableOpacity onPress={openSettings} style={{paddingHorizontal: 20, paddingVertical: 10, borderColor: colors.text, borderWidth: 2, borderRadius: 10}}>
                            <Text style={{fontSize: 30, textAlign: 'center', color: colors.text}}>Open System Settings</Text>
                        </TouchableOpacity>
                    </>
                : cameraPermission === "restricted" ?
                    <>
                        <Text style={{fontSize: 30, textAlign: 'center', color: colors.text}}>APicADay cannot access your camera because it's access has been restricted, possibly due to active restrictions such as parental controls.</Text>
                    </>
                :
                    <>
                        <Text style={{fontSize: 30, textAlign: 'center', color: colors.text}}>An error occurred. cameraPermission is unknown: {cameraPermission}</Text>
                    </>
            }
        </View>
    )
}

const styles = StyleSheet.create({
    dropShadow: {
        elevation: 20,
        shadowColor: 'black',
        shadowOffset: {width: 1, height: 1},
        shadowOpacity: 0.6,
        shadowRadius: 10
    }
})

export default TakePhoto;