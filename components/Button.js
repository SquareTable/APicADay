import { useTheme } from "@react-navigation/native";
import { Text, TouchableOpacity } from "react-native";

export default function Button({onPress, text, style = {}, textStyle = {}, disabled = false, active = true}) {
    const {colors} = useTheme();

    return (
        <TouchableOpacity disabled={disabled} onPress={onPress} style={{borderWidth: 1, borderColor: colors.text, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 10, opacity: active ? 1 : 0.6, ...style}}>
            <Text style={{fontSize: 20, fontWeight: 'bold', color: colors.text, ...textStyle}}>{text}</Text>
        </TouchableOpacity>
    )
}