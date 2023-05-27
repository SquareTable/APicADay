import {View, Text, TouchableOpacity, Dimensions} from 'react-native';
import {Component} from 'react';
import FontAwesomeFive from 'react-native-vector-icons/FontAwesome5';
import ImageModal from 'react-native-image-modal';

class Photo extends Component {
    constructor(props) {
        super(props);

        this.date = new Date(parseInt(props.item[0]))
        this.image = 'data:image/jpeg;base64,' + this.props.item[1]
    }

    shouldComponentUpdate() {
        return false
    }

    render() {
        return (
            <View style={{justifyContent: 'center', alignItems: 'center', margin: 3, width: '50%'}}>
                <Text style={{fontSize: 24, fontWeight: 'bold'}}>{this.date.getDate()}/{this.date.getMonth() + 1}/{this.date.getFullYear()}</Text>
                <ImageModal
                    resizeMode="contain"
                    style={{
                        width: '100%',
                        aspectRatio: 1
                    }}
                    source={{
                        uri: this.image,
                    }}
                />
                <TouchableOpacity onPress={() => this.props.deleteImage(this.props.item[0])} style={{borderColor: 'black', borderWidth: 3, borderRadius: 50, padding: 10, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginTop: 10}}>
                    <FontAwesomeFive color="black" size={24} name="trash"/>
                </TouchableOpacity>
            </View>
        )
    }
}

export default Photo;