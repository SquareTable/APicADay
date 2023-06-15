import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TakePhoto from '../screens/TakePhoto';
import Gallery from '../screens/Gallery';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome from 'react-native-vector-icons/FontAwesome'
import { useTheme } from '@react-navigation/native';
import { SettingsStack } from './Stack';


const Tab = createBottomTabNavigator();


const Tabs = ({navigation}) => {
    const {colors} = useTheme();
    return(
        <Tab.Navigator
            screenOptions={{
                tabBarShowLabel: false,
                headerShown: false,
            }}
        >
            <Tab.Screen name="TakePhoto" component={TakePhoto} options={{
                tabBarIcon: ({focused}) => (
                    <View style={{alignItems: 'center', justifyContent: 'center'}}>
                        <Entypo name="camera" size={25} color={focused ? 'red' : colors.text}/>
                    </View>
                ),
            }} />
            <Tab.Screen name="Gallery" component={Gallery} options={{
                tabBarIcon: ({focused}) => (
                    <View style={{alignItems: 'center', justifyContent: 'center'}}>
                        <FontAwesome name="photo" size={25} color={focused ? 'red' : colors.text}/>
                    </View>
                ),
            }} />
            <Tab.Screen name="Settings" component={SettingsStack} options={{
                tabBarIcon: ({focused}) => (
                    <View style={{alignItems: 'center', justifyContent: 'center'}}>
                        <FontAwesome name="gear" size={25} color={focused ? 'red' : colors.text}/>
                    </View>
                ),
            }} />
        </Tab.Navigator>
    );
};

export default Tabs;