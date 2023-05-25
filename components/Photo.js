import {View, Text, Image, TouchableOpacity} from 'react-native';
import {Component} from 'react';
import FontAwesomeFive from 'react-native-vector-icons/FontAwesome5'

class Photo extends Component {
    constructor(props) {
        super(props);

        this.date = new Date(parseInt(props.item[0]))
        this.image = 'data:image/jpeg;base64,' + this.props.item[1]
    }

    shouldComponentUpdate() {
        return false;
    }

    render() {
        return (
            <View style={{justifyContent: 'center', alignItems: 'center', margin: 3}}>
                <Text style={{fontSize: 24, fontWeight: 'bold'}}>{this.date.getDate()}/{this.date.getMonth() + 1}/{this.date.getFullYear()}</Text>
                <Image style={{width: '50%', aspectRatio: 1, borderRadius: 20}} source={{uri: this.image}}></Image>
                <TouchableOpacity onPress={() => this.props.deleteImage(this.props.item[0])} style={{borderColor: 'black', borderWidth: 3, borderRadius: 50, padding: 10, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginTop: 10}}>
                    <FontAwesomeFive color="black" size={24} name="trash"/>
                </TouchableOpacity>
            </View>
        )
    }
}

export default Photo;