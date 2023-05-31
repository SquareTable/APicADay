import {View} from 'react-native';

const Circle = ({width, color, style = {}}) => {
    return (
        <View style={{...style, width: width, height: width, backgroundColor: color, borderRadius: 1000}}></View>
    )
}

export default Circle;