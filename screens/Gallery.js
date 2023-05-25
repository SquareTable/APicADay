import {useState, useEffect} from 'react';
import {View, Text, SafeAreaView, FlatList} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Photo from '../components/Photo';
import { useIsFocused } from '@react-navigation/native';

const Gallery = () => {
    const [photos, setPhotos] = useState(null)
    const isFocused = useIsFocused();

    useEffect(() => {
        async function getPhotos() {
            const keys = await AsyncStorage.getAllKeys()
            const data = await AsyncStorage.multiGet(keys)

            setPhotos(data)
        }

        if (isFocused) getPhotos()
    }, [isFocused])

    const deleteImage = (dateCreated) => {
        AsyncStorage.removeItem(dateCreated).then(() => {
            setPhotos(currentPhotos => {
                const index = currentPhotos.findIndex(item => item[0] === dateCreated)
                if (index === -1) {
                    alert('Could not find photo to delete')
                    return currentPhotos
                }

                const newPhotos = currentPhotos.slice()
                newPhotos.splice(index, 1)

                return newPhotos
            })
        }).catch(error => {
            console.error(error)
            alert('An error occurred while removing item.')
        })
    }

    return (
        <>
            {
                photos ?
                    photos.length ?
                        <SafeAreaView>
                            <FlatList
                                data={photos}
                                keyExtractor={(item) => item[0]}
                                renderItem={({item}) => <Photo item={item} deleteImage={deleteImage}/>}
                                numColumns={2}
                                style={{width: '100%', height: '100%'}}
                            />
                        </SafeAreaView>
                    :
                        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                            <Text style={{color: 'red', fontSize: 30, marginTop: 30}}>You have no photos.</Text>
                        </View>
                :
                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{color: 'red', fontSize: 30, marginTop: 30}}>Loading...</Text>
                    </View>
            }
        </>
    )
}

export default Gallery;