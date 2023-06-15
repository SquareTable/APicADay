import {View, Text, TouchableOpacity, Dimensions} from 'react-native';
import {Component} from 'react';
import FontAwesomeFive from 'react-native-vector-icons/FontAwesome5';
import ImageModal from 'react-native-image-modal';
import AsyncStorage from '@react-native-async-storage/async-storage';

class Photo extends Component {
    constructor(props) {
        super(props);

        this.date = new Date(parseInt(props.item))
        this.state = {
            image: 'data:image/jpeg;base64,'
        }
    }

    componentDidMount() {
        AsyncStorage.getItem('IMAGE-' + this.props.item).then((item) => {
            this.setState({
                image: 'data:image/jpeg;base64,' + JSON.parse(item).base64Image
            })
        }).catch(error => {
            console.error(error)
            alert('An error occurred while loading image.')
        })
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.colors !== this.props.colors || nextState.image !== this.state.image
    }

    render() {
        return (
            <View style={{justifyContent: 'center', alignItems: 'center', margin: 3, width: '50%'}}>
                <Text style={{fontSize: 24, fontWeight: 'bold', color: this.props.colors.text}}>{this.date.getDate()}/{this.date.getMonth() + 1}/{this.date.getFullYear()}</Text>
                <ImageModal
                    resizeMode="contain"
                    style={{
                        width: '100%',
                        aspectRatio: 1
                    }}
                    source={{
                        uri: this.state.image,
                    }}
                />
                <TouchableOpacity onPress={() => this.props.deleteImage(this.props.item)} style={{borderColor: this.props.colors.text, borderWidth: 3, borderRadius: 50, padding: 10, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginTop: 10}}>
                    <FontAwesomeFive color={this.props.colors.text} size={24} name="trash"/>
                </TouchableOpacity>
            </View>
        )
    }
}

export default Photo;