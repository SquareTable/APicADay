import { TouchableOpacity, Text } from "react-native";
import { useTheme } from "@react-navigation/native";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'

const SettingRow = ({settingName, navigateTo, navigation}) => {
    const {colors} = useTheme();

    return (
        <TouchableOpacity onPress={() => navigation.navigate(navigateTo)} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 5}}>
            <Text style={{color: colors.text, fontWeight: 'bold', fontSize: 18}}>{settingName}</Text>
            <MaterialIcons name="arrow-forward-ios" color={colors.text} size={18}/>
        </TouchableOpacity>
    )
}

export default SettingRow;