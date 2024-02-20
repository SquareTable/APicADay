import { useContext, useEffect } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { AppStylingContext } from "../../context/AppStylingContext";
import { useTheme } from "@react-navigation/native";
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RadioButton from "../../components/RadioButton";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AppStyling = () => {
    const {appStylingContextState, setAppStylingContextState} = useContext(AppStylingContext);
    const { colors } = useTheme();

    useEffect(() => {
        AsyncStorage.setItem('AppStylingContextState', String(appStylingContextState)).then(() => {
            console.log('Successfully saved')
        }).catch(error => {
            console.error('An error occurred while saving appStylingContextState to AppStylingContextState in AsyncStorage:', error)
            alert('An error occurred while saving app styling choice. Please try again.')
        })
    }, [appStylingContextState])

    return (
        <View style={{flex: 1, alignItems: 'center', flexDirection: 'row'}}>
            <TouchableOpacity onPress={() => setAppStylingContextState('Default')} style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', width: `${100/3}%`}}>
                <Text style={{color: colors.text, fontSize: 18, fontWeight: 'bold', maxWidth: '100%', textAlign: 'center'}}>System Setting</Text>
                <MaterialCommunityIcons name="theme-light-dark" size={84} color={colors.text}/>
                <RadioButton selected={appStylingContextState === 'Default'} colors={colors} disabled={true}/>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setAppStylingContextState('Dark')} style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', width: `${100/3}%`}}>
                <Text style={{color: colors.text, fontSize: 18, fontWeight: 'bold', textAlign: 'center'}}>Dark</Text>
                <Ionicons name="moon-outline" size={77} color={colors.text}/>
                <RadioButton selected={appStylingContextState === 'Dark'} colors={colors} disabled={true}/>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setAppStylingContextState('Light')} style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', width: `${100/3}%`}}>
                <Text style={{color: colors.text, fontSize: 18, fontWeight: 'bold', textAlign: 'center'}}>Light</Text>
                <Feather name="sun" size={70} color={colors.text} style={{marginBottom: 10}}/>
                <RadioButton selected={appStylingContextState === 'Light'} colors={colors} disabled={true}/>
            </TouchableOpacity>
        </View>
    )
}

export default AppStyling;