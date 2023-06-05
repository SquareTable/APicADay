import {useState, useEffect, useRef} from 'react';
import {View, Text, Linking, TouchableOpacity, StyleSheet, ActivityIndicator} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useIsFocused, useTheme } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from 'react-native-vector-icons/Ionicons';


const TakePhoto = () => {
    const [cameraPermission, setCameraPermission] = useState()
    const devices = useCameraDevices('wide-angle-camera')
    const frontAndBackEnabled = !!(devices.front && devices.back);
    const frontDevice = devices.front;
    const backDevice = devices.back;
    const device = devices.back;
    const focused = useIsFocused();
    const camera = useRef();
    const [takenPhotoToday, setTakenPhotoToday] = useState(null)
    const [chosenCamera, setChosenCamera] = useState('back')
    const { colors } = useTheme()

    console.log(device)


    useEffect(() => {
        (async function() {
            const status = await Camera.getCameraPermissionStatus()
            if (status === 'authorized') {
                const keys = await AsyncStorage.getAllKeys()
                const data = await AsyncStorage.multiGet(keys)

                const now = new Date()

                console.log('Data:', data)

                const index = data.findIndex(([key, value]) => {
                    //key is createdAt
                    //value is photo base64 string
                    const createdDate = new Date(parseInt(key))

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
            }
            setCameraPermission(status)
        })();
    }, [focused])

    const openSettings = async () => {
        await Linking.openSettings();
    }

    const allowCameraAccess = async () => {
        setCameraPermission(await Camera.requestCameraPermission())
    }

    const takePhoto = async () => {
        const photo = await camera.current.takePhoto({
            flash: 'off'
        })

        console.log('Photo:', photo)

        console.log(await RNFS.readFile(photo.path, 'base64'))

        const nowMs = Date.now()
        AsyncStorage.setItem(String(nowMs), await RNFS.readFile(photo.path, 'base64')).then(() => {
            RNFS.unlink(photo.path)
            .then(() => {
                console.log('File deleted');
                setTakenPhotoToday(true)
            })
            .catch((err) => {
                console.error(err.message);
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
                : cameraPermission === "authorized" ?
                    !frontDevice && !backDevice ?
                        <Text style={{fontSize: 24, textAlign: 'center', fontWeight: 'bold', marginHorizontal: 10, color: colors.text}}>Could not find a camera device to use</Text>
                    : takenPhotoToday ?
                        <Text style={{fontSize: 30, textAlign: 'center', color: colors.text}}>You have already taken a photo today. Come back tomorrow</Text>
                    :
                        device == null ?
                            <ActivityIndicator size="large" color={colors.text}/>
                        :
                            <>
                                <Camera
                                    style={{height: '100%', width: '100%'}}
                                    device={frontAndBackEnabled ? chosenCamera === 'front' ? frontDevice : backDevice : frontDevice || backDevice}
                                    isActive={focused}
                                    photo={true}
                                    ref={camera}
                                />
                                <TouchableOpacity onPress={takePhoto} style={{position: 'absolute', zIndex: 2, backgroundColor: 'black', width: 70, height: 70, borderColor: 'white', borderWidth: 2, borderRadius: 1000, top: '90%'}}></TouchableOpacity>
                                {frontAndBackEnabled && (
                                    <TouchableOpacity onPress={changeCamera} style={{position: 'absolute', zIndex: 2, top: '90%', left: 20}}>
                                        <Ionicons name="camera-reverse-sharp" size={70} color="white"/>
                                    </TouchableOpacity>
                                )}
                            </>
                : cameraPermission === "not-determined" ?
                    <>
                        <Text style={{fontSize: 30, textAlign: 'center', color: colors.text}}>APicADay needs access to your camera to function</Text>
                        <TouchableOpacity onPress={allowCameraAccess} style={{paddingHorizontal: 20, paddingVertical: 10, borderColor: colors.text, borderWidth: 2, borderRadius: 10}}>
                            <Text style={{fontSize: 30, textAlign: 'center', color: colors.text}}>Allow Camera Usage</Text>
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

export default TakePhoto;