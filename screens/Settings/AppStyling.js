import { useContext } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { AppStylingContext } from "../../context/AppStylingContext";
import { useTheme } from "@react-navigation/native";
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RadioButton from "../../components/RadioButton";

const AppStyling = () => {
    const {appStylingContextState, setAppStylingContextState} = useContext(AppStylingContext);
    const { colors } = useTheme();

    return (
        <View style={{flex: 1, justifyContent: 'space-around', alignItems: 'center', flexDirection: 'row'}}>
            <TouchableOpacity onPress={() => setAppStylingContextState('Default')} style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
                <Text style={{color: colors.text, fontSize: 20, fontWeight: 'bold'}}>Default</Text>
                <MaterialCommunityIcons name="theme-light-dark" size={84} color={colors.text}/>
                <RadioButton selected={appStylingContextState === 'Default'} colors={colors} disabled={true}/>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setAppStylingContextState('Dark')} style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
                <Text style={{color: colors.text, fontSize: 20, fontWeight: 'bold'}}>Dark</Text>
                <Ionicons name="moon-outline" size={77} color={colors.text}/>
                <RadioButton selected={appStylingContextState === 'Dark'} colors={colors} disabled={true}/>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setAppStylingContextState('Light')} style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
                <Text style={{color: colors.text, fontSize: 20, fontWeight: 'bold'}}>Light</Text>
                <Feather name="sun" size={70} color={colors.text} style={{marginBottom: 10}}/>
                <RadioButton selected={appStylingContextState === 'Light'} colors={colors} disabled={true}/>
            </TouchableOpacity>
        </View>
    )
}

export default AppStyling;