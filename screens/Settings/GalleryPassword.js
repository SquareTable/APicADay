import { useState, useEffect } from "react";
import EncryptedStorage from 'react-native-encrypted-storage';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import ToggleOption from "../../components/ToggleOption";
import { useTheme } from "@react-navigation/native";

export default function GalleryPasswordSettings() {
    const [passwordSet, setPasswordSet] = useState(false);
    const [passwordView, setPasswordView] = useState(null);
    const [processingPassword, setProcessingPassword] = useState(false)
    const [enterPassword, changeEnterPassword] = useState('');
    const [confirmPassword, changeConfirmPassword] = useState('');
    const [createPasswordError, setCreatePasswordError] = useState(null)
    const [unlockingError, setUnlockingError] = useState(null);
    const {colors} = useTheme();

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

    function resetInputs() {
        changeEnterPassword('')
        changeConfirmPassword('')
    }

    async function setPassword() {
        setCreatePasswordError(null)
        setProcessingPassword(true)

        if (enterPassword !== confirmPassword) {
            setProcessingPassword(false)
            return setCreatePasswordError('Passwords do not match')
        }

        if (enterPassword.length < 8) {
            setProcessingPassword(false)
            return setCreatePasswordError('Password must be longer than 8 characters')
        }

        if (enterPassword.length > 500) {
            setProcessingPassword(false)
            return setCreatePasswordError('Please keep your password under 1000 characters')
        }

        try {
            await EncryptedStorage.setItem('app-password', enterPassword)
            setPasswordSet(true)
            setProcessingPassword(false)
            setPasswordView(null)
            resetInputs()
        } catch (error) {
            setProcessingPassword(false)
            setCreatePasswordError('An error occurred: ' + error)
        }
    }

    async function removePassword() {
        setUnlockingError(null)
        try {
            const storedPassword = await EncryptedStorage.getItem('app-password')
            if (storedPassword === enterPassword) {
                try {
                    await EncryptedStorage.removeItem('app-password')
                    setPasswordSet(false)
                    setPasswordView(null)
                    resetInputs()
                } catch (error) {
                    console.error(error)
                    setUnlockingError('An error occurred while removing password: ' + error)
                }
            } else {
                setUnlockingError('Wrong password')
                resetInputs()
            }
        } catch(error) {
            console.error(error)
            setUnlockingError('An error occurred:' + error)
        }
    }

    function cancelPasswordView() {
        setPasswordView(null)
        resetInputs()
    }

    return (
        <>
            {
                passwordView ?
                    processingPassword ?
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <ActivityIndicator color={colors.text} size="large"/>
                        </View>
                    :
                        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                                <Text style={{fontSize: 20, color: colors.text}}>{passwordView === 'Enabling' ? 'Create a Password' : 'Remove your password'}</Text>
                                <TextInput style={{borderWidth: 1, width: 200, height: 30, marginTop: 10, color: colors.text, borderColor: colors.text, paddingLeft: 5, borderRadius: 5}} placeholder="Enter Password" placeholderTextColor={colors.text} value={enterPassword} onChangeText={changeEnterPassword} secureTextEntry/>
                                {passwordView === 'Enabling' && <TextInput style={{borderWidth: 1, width: 200, height: 30, marginTop: 10, color: colors.text, borderColor: colors.text, paddingLeft: 5, borderRadius: 5}} placeholder='Confirm Password' placeholderTextColor={colors.text} value={confirmPassword} onChangeText={changeConfirmPassword} secureTextEntry/>}
                                <Text style={{color: 'red', fontSize: 15, textAlign: 'center'}}>{(passwordView === 'Enabling' ? createPasswordError : unlockingError) || ' '}</Text>
                                <TouchableOpacity onPress={cancelPasswordView} style={{borderWidth: 1, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 10, borderColor: colors.text}}>
                                    <Text style={{fontSize: 20, fontWeight: 'bold', color: colors.text}}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => passwordView === 'Enabling' ? setPassword() : removePassword()} style={{borderWidth: 1, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 10, borderColor: colors.text}}>
                                    <Text style={{fontSize: 20, fontWeight: 'bold', color: colors.text}}>{passwordView === 'Enabling' ? 'Save Password' : 'Remove Password'}</Text>
                                </TouchableOpacity>
                            </KeyboardAvoidingView>
                        </TouchableWithoutFeedback>
                :
                    <>
                        <ToggleOption value={passwordSet} onValueChange={(enabling) => setPasswordView(enabling ? 'Enabling' : 'Disabling')} sideText="Password Enabled"/>
                        {passwordSet === false && <Text style={{color: 'red', fontSize: 16, fontWeight: 'bold', textAlign: 'center'}}>WARNING: Once a password has been set, you cannot reset it. Please make sure to remember the password and keep it safe. You can only turn off the password if you know the password.</Text>}
                    </>
            }
        </>
    )
}