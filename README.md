# FPL Improver App

This is an expo application using react native typscript, which is fully functional on mobile. The model is trained using scikit_learn in python and the web scraper used pandas, with the api being initialised using flask. OS is used in the background for working in conjuction with the operating system and joblib allows for for loops working in parallel.

# Steps

Step 1: Run the FPL_Scraper to ensure the most up-to-date CSV file.  
Step 2: Run the FPL_Model to update scalers and models with up to date.  
Step 3: Run the FPL_API to run to localhost  
Step 4: Run the application (terminal input below)  

Note: this model will only work apprporiately whilst there are fixtures left in the season - as it takes an average fixture difficulty over the next 3 gameweeks, at the end of the season this will result in incorrect outputs.  

Dependencies/libraries in python that must be installed for this program to run include pandas,numpy,flask,joblib,os,scikit-learn,requests  
Other requirements include ngrok being installed , expo-router, react-native  


you'll be able to open the app in:

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

- to do this you'll need to type npx expo start into the terminal


