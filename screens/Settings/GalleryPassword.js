import { useState, useEffect } from "react";
import EncryptedStorage from 'react-native-encrypted-storage';
import { Alert } from "react-native";
import ToggleOption from "../../components/ToggleOption";

export default function GalleryPasswordSettings() {
    const [passwordSet, setPasswordSet] = useState(false);

    useEffect(() => {
        async function getIsPasswordSet() {
            try {
                const password = await EncryptedStorage.getItem("app-password");
                setPasswordSet(!!password)
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

        getIsPasswordSet()
    }, [])

    return (
        <ToggleOption value={passwordSet} onValueChange={setPasswordSet} sideText="Password Enabled"/>
    )
}