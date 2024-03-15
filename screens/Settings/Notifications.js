import { useState, useEffect } from "react";
import { View, Text, SafeAreaView, ActivityIndicator, Linking, TouchableOpacity } from "react-native";
import notifee, { AuthorizationStatus, TriggerType, RepeatFrequency } from '@notifee/react-native';
import { useTheme } from "@react-navigation/native";
import ToggleOption from "../../components/ToggleOption";
import DatePicker from 'react-native-date-picker';
import AsyncStorage from "@react-native-async-storage/async-storage";

const NotificationsSettings = () => {
    const [notificationAuthorizationStatus, setNotificationAuthorizationStatus] = useState(null)
    const [notificationsEnabled, setNotificationsEnabled] = useState(null)
    const theme = useTheme();
    const {colors, dark} = theme;
    const [date, setDate] = useState(new Date())
    const [notificationTimeString, setNotificationTimeString] = useState(null)

    useEffect(() => {
        async function checkNotificationPermissions() {
            const settings = await notifee.getNotificationSettings();
            setNotificationAuthorizationStatus(settings.authorizationStatus)
        }

        async function checkNotificationTime() {
            AsyncStorage.getItem('daily-notification-time').then((value => {
                if (value) {
                    const date = new Date();
                    const splitValue = value.split(':')

                    const addHours = value.slice(5) === 'PM' ? 12 : 0;

                    date.setHours(parseInt(splitValue[0]) + addHours)
                    date.setMinutes(parseInt(splitValue[1]))

                    setDate(date)
                    setNotificationTimeString(value)
                    setNotificationsEnabled(true)
                } else {
                    setNotificationsEnabled(false)
                    setNotificationTimeString('')
                }
            })).catch(error => {
                alert('An error occurred while loading notification settings:' + error)
                console.error(error)
            })
        }

        checkNotificationPermissions();
        checkNotificationTime();
    }, [])

    function calculateNotificationTimeString() {
        let hours = date.getHours();
        const minutes = date.getMinutes();

        let notificationDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        notificationDate.setHours(hours)
        notificationDate.setMinutes(minutes)

        const PM = hours > 12;
        if (hours > 12) hours -= 12;

        const trigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: notificationDate.getTime(),
            repeatFrequency: RepeatFrequency.DAILY
        };

        const notification = {
            title: 'Daily Reminder',
            body: 'This is your daily reminder to take a photo with APicADay',
            android: {
                channelId: 'default',
                smallIcon: 'ic_launcher',
            },
            ios: {
                sound: 'default',
            },
        };

        return new Promise(async (resolve, reject) => {
            const timeString = `${hours}:${minutes < 10 ? ('0' + minutes) : minutes}${PM ? 'PM' : 'AM'}`
            try {
                await notifee.cancelTriggerNotifications()
            } catch (error) {
                return reject(error)
            }

            try {
                await AsyncStorage.setItem('daily-notification-time', timeString)
            } catch (error) {
                return reject(error)
            }
            
            if (notificationsEnabled) {
                try {
                    await notifee.createTriggerNotification(notification, trigger);
                } catch (error) {
                    return reject(error)
                }
            }

            resolve(`${hours}:${minutes < 10 ? ('0' + minutes) : minutes}${PM ? 'PM' : 'AM'}`)
        })
    }

    useEffect(() => {
        calculateNotificationTimeString().then(string => {
            setNotificationTimeString(string)
        }).catch(error => {
            console.error(error)
            alert('An error occurred while changing notification time. Please try again. The error was:' + error)
        })
    }, [date])

    const changeNotificationsEnabled = (value) => {
        if (value) {
            calculateNotificationTimeString().then(string => {
                AsyncStorage.setItem('daily-notification-time', string).then(() => {
                    setNotificationTimeString(string)
                    setNotificationsEnabled(true)
                }).catch(error => {
                    console.error(error)
                    alert('An error occurred:' + error)
                })
            }).catch(error => {
                console.error(error)
                alert('An error occurred while turning on notifications:' + error)
            })
        } else {
            AsyncStorage.removeItem('daily-notification-time').then(() => {
                notifee.cancelTriggerNotifications().then(() => {
                    setNotificationTimeString('')
                    setNotificationsEnabled(false)
                }).catch(error => {
                    console.error(error)
                    alert('An error occurred while turning off notifications:' + error)
                })
            }).catch(error => {
                console.error(error)
                alert('An error occurred:' + error)
            })
        }
    }

    const openSettings = async () => {
        await Linking.openSettings();
    }

    const requestNotificationPermission = async () => {
        const settings = await notifee.requestPermission({
            alert: true
        });
        setNotificationAuthorizationStatus(settings.authorizationStatus)
    }

    useEffect(() => {
        //This is needed so then the time picker refreshes itself when the theme changes
        //Without this, if you change the app theme, you will not be able to properly see the time picker unless you change the time in the time picker
        setDate(date => new Date(date.getTime()))
    }, [theme])

    if (notificationAuthorizationStatus === null || notificationsEnabled === null || notificationTimeString === null) return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator size="large" color={colors.text}/></View>

    if (notificationAuthorizationStatus === AuthorizationStatus.DENIED) return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{fontSize: 20, textAlign: 'center', color: colors.text, marginBottom: 10, fontWeight: 'bold'}}>Notifications have been disabled for APicADay in your system settings. To allow notifications to be used by APicADay, please open your system settings.</Text>
            <TouchableOpacity onPress={openSettings} style={{paddingHorizontal: 20, paddingVertical: 10, borderColor: colors.text, borderWidth: 2, borderRadius: 10}}>
                <Text style={{fontSize: 30, textAlign: 'center', color: colors.text}}>Open System Settings</Text>
            </TouchableOpacity>
        </View>
    )

    if (notificationAuthorizationStatus === AuthorizationStatus.NOT_DETERMINED) return (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{fontSize: 24, textAlign: 'center', color: colors.text, marginBottom: 10, fontWeight: 'bold'}}>Notifications have not yet been enabled for APicADay.</Text>
            <Text style={{fontSize: 14, textAlign: 'center', color: colors.text, marginBottom: 10}}>You can turn notifications on or off at any time in your system settings or in APicADay. If notifications are turned on, a notification will be sent to you daily to remind you to take a photo of yourself. Notifications can be sent at any time of day you choose.</Text>
            <TouchableOpacity onPress={requestNotificationPermission} style={{paddingHorizontal: 20, paddingVertical: 10, borderColor: colors.text, borderWidth: 2, borderRadius: 10}}>
                <Text style={{fontSize: 30, textAlign: 'center', color: colors.text}}>Enable Notifications</Text>
            </TouchableOpacity>
        </View>
    )

    return (
        <SafeAreaView>
            <ToggleOption value={notificationsEnabled} onValueChange={changeNotificationsEnabled} sideText="Notifications"/>
            {notificationsEnabled && (
                <View style={{flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={{fontSize: 20, fontWeight: 'bold', color: colors.text, textAlign: 'center'}}>Time to receive notification:</Text>
                    <DatePicker date={date} onDateChange={setDate} mode="time" textColor={dark ? '#FFFFFF' : '#000000'}/>
                    <Text style={{fontSize: 20, fontWeight: 'bold', color: colors.text, textAlign: 'center'}}>You will receieve a notification daily at: {notificationTimeString}</Text>
                </View>
            )}
        </SafeAreaView>
    )
}

export default NotificationsSettings;