# Firebase Notes App

This is a simple note-taking application using Firebase as a backend.

https://hjpad.github.io/html_notes-fb/


## Setup

1. Clone this repository:
   git clone https://github.com/yourusername/your-repo-name.git
   cd your-repo-name

2. Set up Firebase:
- Go to the [Firebase Console](https://console.firebase.google.com/)
- Create a new project (or select an existing one)
- In the project settings, add a new web app
- Copy the Firebase configuration object

3. Configure Firebase for the app:
- Navigate to the `docs/js/` directory
- Copy `firebaseConfig.example.js` to `firebaseConfig.js`:
  ```
  cp docs/js/firebaseConfig.example.js docs/js/firebaseConfig.js
  ```
- Open `firebaseConfig.js` and replace the placeholder values with your actual Firebase configuration

4. Set up Firebase Security Rules:
- In the Firebase Console, go to Firestore Database
- Navigate to the "Rules" tab
- Replace the existing rules with:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /notes/{noteId} {
        allow read, write: if true;  // Note: For production, implement proper authentication
      }
    }
  }
  ```
- Publish the rules

5. Run the app:
- Open `docs/index.html` in your web browser
- For a better experience, use a local server. You can use Python's built-in HTTP server:
  ```
  cd docs
  python -m http.server 8000
  ```
Then open `http://localhost:8000` in your web browser.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

- Firebase for providing the backend infrastructure
- Font Awesome for the icons