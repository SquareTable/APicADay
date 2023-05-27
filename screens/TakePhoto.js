import {useState, useEffect, useRef} from 'react';
import {View, Text, Linking, TouchableOpacity, StyleSheet} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';


const TakePhoto = () => {
    const [cameraPermission, setCameraPermission] = useState()
    const devices = useCameraDevices('wide-angle-camera')
    const device = devices.back;
    const focused = useIsFocused();
    const camera = useRef();
    const [takenPhotoToday, setTakenPhotoToday] = useState(null)

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
  

    return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            {
                cameraPermission == undefined ?
                    <>
                        <Text style={{color: 'red', fontSize: 30, textAlign: 'center'}}>Loading...</Text>
                    </>
                : cameraPermission === "authorized" ?
                    takenPhotoToday ?
                        <>
                            <Text style={{color: 'red', fontSize: 30, textAlign: 'center'}}>You have already taken a photo today. Come back tomorrow</Text>
                        </>
                    :
                        device == null ?
                            <Text style={{color: 'red', fontSize: 30, textAlign: 'center'}}>Loading...</Text>
                        :
                            <>
                                <Camera
                                    style={{height: '100%', width: '100%'}}
                                    device={device}
                                    isActive={focused}
                                    photo={true}
                                    ref={camera}
                                />
                                <TouchableOpacity onPress={takePhoto} style={{position: 'absolute', zIndex: 2, backgroundColor: 'black', width: 70, height: 70, borderColor: 'white', borderWidth: 2, borderRadius: 1000, top: '90%'}}></TouchableOpacity>
                            </>
                : cameraPermission === "not-determined" ?
                    <>
                        <Text style={{color: 'red', fontSize: 30, textAlign: 'center'}}>APicADay needs access to your camera to function</Text>
                        <TouchableOpacity onPress={allowCameraAccess} style={{paddingHorizontal: 20, paddingVertical: 10, borderColor: 'black', borderWidth: 2, borderRadius: 10}}>
                            <Text style={{color: 'red', fontSize: 30, textAlign: 'center'}}>Allow Camera Usage</Text>
                        </TouchableOpacity>
                    </>
                : cameraPermission === "denied" ?
                    <>
                        <Text style={{color: 'red', fontSize: 30, textAlign: 'center'}}>Camera usage for APicADay has been denied in your system settings. Please enable them</Text>
                        <TouchableOpacity onPress={openSettings} style={{paddingHorizontal: 20, paddingVertical: 10, borderColor: 'black', borderWidth: 2, borderRadius: 10}}>
                            <Text style={{color: 'red', fontSize: 30, textAlign: 'center'}}>Open System Settings</Text>
                        </TouchableOpacity>
                    </>
                : cameraPermission === "restricted" ?
                    <>
                        <Text style={{color: 'red', fontSize: 30, textAlign: 'center'}}>APicADay cannot access your camera because it's access has been restricted, possibly due to active restrictions such as parental controls.</Text>
                    </>
                :
                    <>
                        <Text style={{color: 'red', fontSize: 30, textAlign: 'center'}}>An error occurred. cameraPermission is unknown: {cameraPermission}</Text>
                    </>
            }
        </View>
    )
}

export default TakePhoto;