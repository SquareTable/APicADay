import { createStackNavigator } from '@react-navigation/stack';
import AppStyling from '../screens/Settings/AppStyling';
import SettingsScreen from '../screens/Settings';
import NotificationsSettings from '../screens/Settings/Notifications';

const Stack = createStackNavigator();

export const SettingsStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen name="SettingsScreen" component={SettingsScreen} options={{title: 'Settings'}}/>
            <Stack.Screen name="AppStylingSettings" component={AppStyling} options={{title: 'App Styling'}}/>
            <Stack.Screen name="NotificationsSettings" component={NotificationsSettings} options={{title: 'Notifications Settings'}}/>
        </Stack.Navigator>
    )
}