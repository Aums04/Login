// src/App.jsx
import { useEffect, useState } from "react";
import { auth, provider, db, ref, set, onValue } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import "./App.css";

const generateSessionId = () => Date.now().toString();

// Helper to get a simple device name
function getDeviceName() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "Android";
  if (/iPad|iPhone|iPod/.test(ua)) return "iOS";
  if (/Win/.test(ua)) return "Windows";
  if (/Mac/.test(ua)) return "Mac";
  if (/Linux/.test(ua)) return "Linux";
  if (/CrOS/.test(ua)) return "Chrome OS";
  return "Unknown Device";
}

function App() {
  const [user, setUser] = useState(null);
  const [localSessionId, setLocalSessionId] = useState(null);
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [lastLogin, setLastLogin] = useState(null);
  const [device, setDevice] = useState("");

  // On mount, load sessionId from localStorage
  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    if (storedSessionId) setLocalSessionId(storedSessionId);
  }, []);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const sessionId = generateSessionId();
      setLocalSessionId(sessionId);
      localStorage.setItem('sessionId', sessionId);
      setIsSessionValid(true);
      const deviceName = getDeviceName();
      const loginTime = Date.now();

      const userRef = ref(db, `users/${result.user.uid}`);
      await set(userRef, { 
        sessionId,
        lastActive: loginTime,
        lastLogin: loginTime,
        device: deviceName
      });

      setUser(result.user);
      setLastLogin(loginTime);
      setDevice(deviceName);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const logout = async () => {
    if (user) {
      const userRef = ref(db, `users/${user.uid}`);
      await set(userRef, null);
    }
    await signOut(auth);
    setUser(null);
    setLocalSessionId(null);
    localStorage.removeItem('sessionId');
    setIsSessionValid(true);
    setLastLogin(null);
    setDevice("");
  };

  const handleSessionInvalid = () => {
    setIsSessionValid(false);
    alert("Your account is being used on another device.");
    logout();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = ref(db, `users/${firebaseUser.uid}`);

        onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          if (!userData) return;

          const dbSessionId = userData.sessionId;
          const lastActive = userData.lastActive;

          if (dbSessionId && localSessionId && dbSessionId !== localSessionId) {
            handleSessionInvalid();
            return;
          }

          if (Date.now() - lastActive > 30000) {
            set(userRef, {
              ...userData,
              lastActive: Date.now()
            });
          }

          // Set lastLogin and device from DB
          setLastLogin(userData.lastLogin || null);
          setDevice(userData.device || "");
        });
      }
    });

    return () => unsubscribe();
  }, [localSessionId]);

  function formatDateTime(ts) {
    if (!ts) return "-";
    const d = new Date(ts);
    return d.toLocaleString();
  }

  if (!isSessionValid) {
    return (
      <div className="app-container">
        <div className="session-expired">
          <h1>Session Expired</h1>
          <p>Your account is being used on another device.</p>
          <button className="login-button" onClick={login}>Login Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="login-card">
        <h1 className="app-title">Welcome</h1>
        {user ? (
          <div className="user-profile">
            <img src={user.photoURL} alt="User" className="profile-image" />
            <h2 className="user-name">{user.displayName}</h2>
            <p className="user-email">{user.email}</p>
            {/* <p style={{ color: '#555', fontSize: '0.95rem', margin: '8px 0' }}>
              Last login: {formatDateTime(lastLogin)}<br />
              Device: {device}
            </p> */}
            <button className="logout-button" onClick={logout}>Logout</button>
          </div>
        ) : (
          <button className="login-button" onClick={login}>Login with Google</button>
        )}
      </div>
    </div>
  );
}

export default App;
