import React, {Component} from 'react';
import {Text, ScrollView, TouchableOpacity, SafeAreaView, Linking} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            errorOccured: false,
            error: 'Error here',
            errorInfo: 'Info here'
        }
    }

    restartApp = () => {
        this.setState({
            errorOccured: false,
            error: null,
            errorInfo: null
        })
    }

    componentDidCatch(error, errorInfo) {
        //Might add Sentry in the future
        console.error('An error was caught from ErrorBoundary')
        console.error('Error:', error)
        console.error('Error Info:', errorInfo)
        this.setState({
            errorOccured: true,
            error: error.toString(),
            errorInfo: errorInfo
        })
      }

    render() {
        if (this.state.errorOccured) {
            return (
                <SafeAreaView style={{backgroundColor: 'black', height: '100%'}}>
                    <ScrollView contentContainerStyle={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{color: 'white', fontSize: 25, fontWeight: 'bold', textAlign: 'center'}}>An error has occured. Scroll down to see more info and to restart APicADay.</Text>
                        <Text style={{color: 'red', fontSize: 20, textAlign: 'center', marginVertical: 20}}>{this.state.error}</Text>
                        {__DEV__ &&
                            <>
                                <Text style={{color: 'white', fontSize: 25, fontWeight: 'bold', textAlign: 'center'}}>Component Stack:</Text>
                                <Text style={{color: 'red', fontSize: 20, textAlign: 'center', marginVertical: 20}}>{String(this.state.errorInfo.componentStack)}</Text>
                            </>
                        }
                        <Text style={{color: 'white', fontSize: 25, fontWeight: 'bold', textAlign: 'center'}}>Please report this issue on GitHub:</Text>
                        <TouchableOpacity style={{backgroundColor: 'black', borderColor: 'white', borderWidth: 2, borderRadius: 20, padding: 10, marginTop: 10}} onPress={() => {Clipboard.setString(this.state.error)}}>
                            <Text style={{color: 'white', fontSize: 18, textAlign: 'center'}}>Copy Error</Text>
                        </TouchableOpacity>
                        {__DEV__ &&
                            <TouchableOpacity style={{backgroundColor: 'black', borderColor: 'white', borderWidth: 2, borderRadius: 20, padding: 10, marginVertical: 20}} onPress={() => {Clipboard.setString(String(this.state.errorInfo?.componentStack))}}>
                                <Text style={{color: 'white', fontSize: 18, textAlign: 'center'}}>Copy Component Stack</Text>
                            </TouchableOpacity>
                        }
                        <TouchableOpacity style={{backgroundColor: 'black', borderColor: 'white', borderWidth: 2, borderRadius: 20, padding: 10}} onPress={() => {Linking.openURL('https://github.com/SquareTable/APicADay/issues/new?assignees=&labels=bug&projects=&template=bug_report.md&title=')}}>
                            <Text style={{color: 'white', fontSize: 18, textAlign: 'center'}}>Create GitHub issue</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{backgroundColor: 'black', borderColor: 'white', borderWidth: 2, borderRadius: 20, marginVertical: 40, paddingHorizontal: 20, paddingVertical: 10}} onPress={this.restartApp}>
                            <Text style={{color: 'white', fontSize: 25, fontWeight: 'bold', textAlign: 'center'}}>Restart APicADay</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            )
        }

        return this.props.children;
    }
}

export default ErrorBoundary