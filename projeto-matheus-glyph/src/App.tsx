/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import QRCodeStyling, {
  Options,
  DrawType,
  TypeNumber,
  Mode,
  ErrorCorrectionLevel,
  DotType,
  CornerSquareType,
  CornerDotType
} from "qr-code-styling";
import { Download, Image as ImageIcon, Link as LinkIcon, Settings, Maximize, Minimize, Layout, Plus, Minus, CircleDot, Square, Circle, Palette, ShieldCheck, Moon, Sun, Lock, Shield, EyeOff, Trash2, X, Info, History, Save, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, onSnapshot, addDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout, UserProfile, SavedGlyph } from './firebase';

interface HistoryItem {
  id: string;
  options: Options;
  timestamp: number;
  previewUrl: string;
}

const FORBIDDEN_KEYWORDS = [
  "bet", "casino", "poker", "slot", "betano", "blaze", "pixbet", "sportingbet", "bet365",
  "porn", "xxx", "sex", "adult", "onlyfans", "xvideos", "pornhub", "redtube", "brazzers"
];

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [savedGlyphs, setSavedGlyphs] = useState<SavedGlyph[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isDotsOptionsOpen, setIsDotsOptionsOpen] = useState(false);
  const [isCornerSquareOptionsOpen, setIsCornerSquareOptionsOpen] = useState(false);
  const [isCornersDotOptionsOpen, setIsCornersDotOptionsOpen] = useState(false);
  const [isBackgroundOptionsOpen, setIsBackgroundOptionsOpen] = useState(false);
  const [isImageOptionsOpen, setIsImageOptionsOpen] = useState(false);
  const [isQrOptionsOpen, setIsQrOptionsOpen] = useState(false);
  const [colorType, setColorType] = useState<"single" | "gradient">("single");
  const [cornerSquareColorType, setCornerSquareColorType] = useState<"single" | "gradient">("single");
  const [cornersDotColorType, setCornersDotColorType] = useState<"single" | "gradient">("single");
  const [backgroundColorType, setBackgroundColorType] = useState<"single" | "gradient">("single");
  const [options, setOptions] = useState<Options>({
    width: 300,
    height: 300,
    type: "svg" as DrawType,
    data: "https://google.com",
    image: "",
    margin: 10,
    qrOptions: {
      typeNumber: 0 as TypeNumber,
      mode: "Byte" as Mode,
      errorCorrectionLevel: "Q" as ErrorCorrectionLevel
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 0,
      crossOrigin: "anonymous",
    },
    dotsOptions: {
      color: "#000000",
      type: "rounded" as DotType
    },
    backgroundOptions: {
      color: "#ffffff",
    },
    cornersSquareOptions: {
      color: "#000000",
      type: "extra-rounded" as CornerSquareType
    },
    cornersDotOptions: {
      color: "#000000",
      type: "dot" as CornerDotType
    }
  });

  const [qrCode] = useState<QRCodeStyling>(new QRCodeStyling(options));
  const ref = useRef<HTMLDivElement>(null);

  const isValidUrl = (url: string) => {
    if (!url) return true;
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return parsed.hostname.includes('.');
    } catch {
      return false;
    }
  };

  const isDataBlocked = React.useMemo(() => {
    if (!options.data) return false;
    const lowerData = options.data.toLowerCase();
    const hasForbidden = FORBIDDEN_KEYWORDS.some(k => lowerData.includes(k));
    return hasForbidden;
  }, [options.data]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync user profile to Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          const newProfile = {
            uid: currentUser.uid,
            email: currentUser.email || "",
            displayName: currentUser.displayName || "User",
            photoURL: currentUser.photoURL || "",
            createdAt: serverTimestamp()
          };
          await setDoc(userRef, newProfile);
        } else {
          setUserProfile(userSnap.data() as UserProfile);
        }
      } else {
        setUserProfile(null);
        setSavedGlyphs([]);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Saved Glyphs
  useEffect(() => {
    if (!user) return;

    const glyphsRef = collection(db, 'users', user.uid, 'glyphs');
    const q = query(glyphsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const glyphs: SavedGlyph[] = [];
      snapshot.forEach((doc) => {
        glyphs.push({ id: doc.id, ...doc.data() } as SavedGlyph);
      });
      setSavedGlyphs(glyphs.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
    }, (err) => {
      handleFirestoreError(err, 'list', `users/${user.uid}/glyphs`);
    });

    return () => unsubscribe();
  }, [user]);

  const handleFirestoreError = (err: any, operation: string, path: string) => {
    const errInfo = {
      error: err.message,
      operationType: operation,
      path,
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email
      }
    };
    console.error('Firestore Error:', JSON.stringify(errInfo));
    setError(`Database error: ${err.message}`);
  };

  const handleSaveGlyph = async () => {
    if (!user || !saveName) return;
    setIsSaving(true);
    setError(null);

    try {
      const glyphsRef = collection(db, 'users', user.uid, 'glyphs');
      await addDoc(glyphsRef, {
        uid: user.uid,
        name: saveName,
        data: options.data,
        options: JSON.parse(JSON.stringify(options)),
        createdAt: serverTimestamp()
      });
      setIsSaveModalOpen(false);
      setSaveName("");
    } catch (err) {
      handleFirestoreError(err, 'create', `users/${user.uid}/glyphs`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGlyph = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'glyphs', id));
    } catch (err) {
      handleFirestoreError(err, 'delete', `users/${user.uid}/glyphs/${id}`);
    }
  };

  const loadSavedGlyph = (glyph: SavedGlyph) => {
    setOptions(glyph.options);
    // Update color type states
    if (glyph.options.dotsOptions?.gradient) setColorType("gradient");
    else setColorType("single");
    if (glyph.options.cornersSquareOptions?.gradient) setCornerSquareColorType("gradient");
    else setCornerSquareColorType("single");
    if (glyph.options.cornersDotOptions?.gradient) setCornersDotColorType("gradient");
    else setCornersDotColorType("single");
    if (glyph.options.backgroundOptions?.gradient) setBackgroundColorType("gradient");
    else setBackgroundColorType("single");

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (ref.current) {
      qrCode.append(ref.current);
    }
  }, [qrCode, ref]);

  useEffect(() => {
    if (isDataBlocked) {
      qrCode.update({
        ...options,
        data: "RESTRICTED",
        dotsOptions: { color: "#000000", type: "square" },
        cornersSquareOptions: { color: "#000000", type: "square" },
        cornersDotOptions: { color: "#000000", type: "square" },
        backgroundOptions: { color: "#000000" },
        image: ""
      });
    } else {
      qrCode.update(options);
    }
  }, [qrCode, options, isDataBlocked]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  const onDataChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const lowerValue = rawValue.toLowerCase();
    
    // Check for forbidden keywords
    const foundKeyword = FORBIDDEN_KEYWORDS.find(keyword => lowerValue.includes(keyword));
    
    if (foundKeyword) {
      setBlockedReason("This site contains restricted content (+18 or Gambling).");
      setIsBlockedModalOpen(true);
    }

    setOptions((prev) => ({
      ...prev,
      data: rawValue
    }));
  };

  const clearData = () => {
    setOptions((prev) => ({
      ...prev,
      data: ""
    }));
  };

  const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setOptions((prev) => ({
          ...prev,
          image: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const onWidthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      width: parseInt(event.target.value, 10) || 0
    }));
  };

  const onHeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      height: parseInt(event.target.value, 10) || 0
    }));
  };

  const onMarginChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      margin: parseInt(event.target.value, 10) || 0
    }));
  };

  const onDotTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setOptions((prev) => ({
      ...prev,
      dotsOptions: {
        ...prev.dotsOptions,
        type: event.target.value as DotType
      }
    }));
  };

  const onDotsColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    setOptions((prev) => ({
      ...prev,
      dotsOptions: {
        ...prev.dotsOptions,
        color: color,
        gradient: undefined
      }
    }));
  };

  const onGradientTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const type = event.target.value as "linear" | "radial";
    setOptions((prev) => ({
      ...prev,
      dotsOptions: {
        ...prev.dotsOptions,
        gradient: {
          ...prev.dotsOptions?.gradient!,
          type: type
        }
      }
    }));
  };

  const onGradientColorChange = (index: number, color: string) => {
    setOptions((prev) => {
      const colorStops = [...(prev.dotsOptions?.gradient?.colorStops || [])];
      if (colorStops[index]) {
        colorStops[index] = { ...colorStops[index], color };
      }
      return {
        ...prev,
        dotsOptions: {
          ...prev.dotsOptions,
          gradient: {
            ...prev.dotsOptions?.gradient!,
            colorStops
          }
        }
      };
    });
  };

  const onRotationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rotation = parseInt(event.target.value, 10) || 0;
    setOptions((prev) => ({
      ...prev,
      dotsOptions: {
        ...prev.dotsOptions,
        gradient: {
          ...prev.dotsOptions?.gradient!,
          rotation: (rotation * Math.PI) / 180
        }
      }
    }));
  };

  const onColorTypeChange = (type: "single" | "gradient") => {
    setColorType(type);
    const currentColor = options.dotsOptions?.color || options.dotsOptions?.gradient?.colorStops[0].color || "#000000";
    const secondaryColor = options.dotsOptions?.gradient?.colorStops[1]?.color || "#ffffff";
    
    if (type === "single") {
      setOptions((prev) => ({
        ...prev,
        dotsOptions: {
          ...prev.dotsOptions,
          color: currentColor,
          gradient: undefined
        }
      }));
    } else {
      setOptions((prev) => ({
        ...prev,
        dotsOptions: {
          ...prev.dotsOptions,
          color: undefined,
          gradient: {
            type: "linear",
            rotation: 0,
            colorStops: [
              { offset: 0, color: currentColor },
              { offset: 1, color: secondaryColor }
            ]
          }
        }
      }));
    }
  };

  const onCornerSquareTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setOptions((prev) => ({
      ...prev,
      cornersSquareOptions: {
        ...prev.cornersSquareOptions,
        type: event.target.value as CornerSquareType
      }
    }));
  };

  const onCornerSquareColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    setOptions((prev) => ({
      ...prev,
      cornersSquareOptions: {
        ...prev.cornersSquareOptions,
        color: color,
        gradient: undefined
      }
    }));
  };

  const onCornerSquareGradientTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const type = event.target.value as "linear" | "radial";
    setOptions((prev) => ({
      ...prev,
      cornersSquareOptions: {
        ...prev.cornersSquareOptions,
        gradient: {
          ...prev.cornersSquareOptions?.gradient!,
          type: type
        }
      }
    }));
  };

  const onCornerSquareGradientColorChange = (index: number, color: string) => {
    setOptions((prev) => {
      const colorStops = [...(prev.cornersSquareOptions?.gradient?.colorStops || [])];
      if (colorStops[index]) {
        colorStops[index] = { ...colorStops[index], color };
      }
      return {
        ...prev,
        cornersSquareOptions: {
          ...prev.cornersSquareOptions,
          gradient: {
            ...prev.cornersSquareOptions?.gradient!,
            colorStops
          }
        }
      };
    });
  };

  const onCornerSquareRotationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rotation = parseInt(event.target.value, 10) || 0;
    setOptions((prev) => ({
      ...prev,
      cornersSquareOptions: {
        ...prev.cornersSquareOptions,
        gradient: {
          ...prev.cornersSquareOptions?.gradient!,
          rotation: (rotation * Math.PI) / 180
        }
      }
    }));
  };

  const onCornerSquareColorTypeChange = (type: "single" | "gradient") => {
    setCornerSquareColorType(type);
    const currentColor = options.cornersSquareOptions?.color || options.cornersSquareOptions?.gradient?.colorStops[0].color || "#000000";
    const secondaryColor = options.cornersSquareOptions?.gradient?.colorStops[1]?.color || "#ffffff";
    
    if (type === "single") {
      setOptions((prev) => ({
        ...prev,
        cornersSquareOptions: {
          ...prev.cornersSquareOptions,
          color: currentColor,
          gradient: undefined
        }
      }));
    } else {
      setOptions((prev) => ({
        ...prev,
        cornersSquareOptions: {
          ...prev.cornersSquareOptions,
          color: undefined,
          gradient: {
            type: "linear",
            rotation: 0,
            colorStops: [
              { offset: 0, color: currentColor },
              { offset: 1, color: secondaryColor }
            ]
          }
        }
      }));
    }
  };

  const onCornerDotTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setOptions((prev) => ({
      ...prev,
      cornersDotOptions: {
        ...prev.cornersDotOptions,
        type: event.target.value as CornerDotType
      }
    }));
  };

  const onCornerDotColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    setOptions((prev) => ({
      ...prev,
      cornersDotOptions: {
        ...prev.cornersDotOptions,
        color: color,
        gradient: undefined
      }
    }));
  };

  const onCornerDotGradientTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const type = event.target.value as "linear" | "radial";
    setOptions((prev) => ({
      ...prev,
      cornersDotOptions: {
        ...prev.cornersDotOptions,
        gradient: {
          ...prev.cornersDotOptions?.gradient!,
          type: type
        }
      }
    }));
  };

  const onCornerDotGradientColorChange = (index: number, color: string) => {
    setOptions((prev) => {
      const colorStops = [...(prev.cornersDotOptions?.gradient?.colorStops || [])];
      if (colorStops[index]) {
        colorStops[index] = { ...colorStops[index], color };
      }
      return {
        ...prev,
        cornersDotOptions: {
          ...prev.cornersDotOptions,
          gradient: {
            ...prev.cornersDotOptions?.gradient!,
            colorStops
          }
        }
      };
    });
  };

  const onCornerDotRotationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rotation = parseInt(event.target.value, 10) || 0;
    setOptions((prev) => ({
      ...prev,
      cornersDotOptions: {
        ...prev.cornersDotOptions,
        gradient: {
          ...prev.cornersDotOptions?.gradient!,
          rotation: (rotation * Math.PI) / 180
        }
      }
    }));
  };

  const onCornerDotColorTypeChange = (type: "single" | "gradient") => {
    setCornersDotColorType(type);
    const currentColor = options.cornersDotOptions?.color || options.cornersDotOptions?.gradient?.colorStops[0].color || "#000000";
    const secondaryColor = options.cornersDotOptions?.gradient?.colorStops[1]?.color || "#ffffff";
    
    if (type === "single") {
      setOptions((prev) => ({
        ...prev,
        cornersDotOptions: {
          ...prev.cornersDotOptions,
          color: currentColor,
          gradient: undefined
        }
      }));
    } else {
      setOptions((prev) => ({
        ...prev,
        cornersDotOptions: {
          ...prev.cornersDotOptions,
          color: undefined,
          gradient: {
            type: "linear",
            rotation: 0,
            colorStops: [
              { offset: 0, color: currentColor },
              { offset: 1, color: secondaryColor }
            ]
          }
        }
      }));
    }
  };

  const onBackgroundColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    setOptions((prev) => ({
      ...prev,
      backgroundOptions: {
        ...prev.backgroundOptions,
        color: color,
        gradient: undefined
      }
    }));
  };

  const onBackgroundGradientTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const type = event.target.value as "linear" | "radial";
    setOptions((prev) => ({
      ...prev,
      backgroundOptions: {
        ...prev.backgroundOptions,
        gradient: {
          ...prev.backgroundOptions?.gradient!,
          type: type
        }
      }
    }));
  };

  const onBackgroundGradientColorChange = (index: number, color: string) => {
    setOptions((prev) => {
      const colorStops = [...(prev.backgroundOptions?.gradient?.colorStops || [])];
      if (colorStops[index]) {
        colorStops[index] = { ...colorStops[index], color };
      }
      return {
        ...prev,
        backgroundOptions: {
          ...prev.backgroundOptions,
          gradient: {
            ...prev.backgroundOptions?.gradient!,
            colorStops
          }
        }
      };
    });
  };

  const onBackgroundRotationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rotation = parseInt(event.target.value, 10) || 0;
    setOptions((prev) => ({
      ...prev,
      backgroundOptions: {
        ...prev.backgroundOptions,
        gradient: {
          ...prev.backgroundOptions?.gradient!,
          rotation: (rotation * Math.PI) / 180
        }
      }
    }));
  };

  const onBackgroundColorTypeChange = (type: "single" | "gradient") => {
    setBackgroundColorType(type);
    const currentColor = options.backgroundOptions?.color || options.backgroundOptions?.gradient?.colorStops[0].color || "#ffffff";
    const secondaryColor = options.backgroundOptions?.gradient?.colorStops[1]?.color || "#e2e2e2";
    
    if (type === "single") {
      setOptions((prev) => ({
        ...prev,
        backgroundOptions: {
          ...prev.backgroundOptions,
          color: currentColor,
          gradient: undefined
        }
      }));
    } else {
      setOptions((prev) => ({
        ...prev,
        backgroundOptions: {
          ...prev.backgroundOptions,
          color: undefined,
          gradient: {
            type: "linear",
            rotation: 0,
            colorStops: [
              { offset: 0, color: currentColor },
              { offset: 1, color: secondaryColor }
            ]
          }
        }
      }));
    }
  };

  const onHideBackgroundDotsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      imageOptions: {
        ...prev.imageOptions,
        hideBackgroundDots: event.target.checked
      }
    }));
  };

  const onImageSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      imageOptions: {
        ...prev.imageOptions,
        imageSize: parseFloat(event.target.value) || 0
      }
    }));
  };

  const onImageMarginChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      imageOptions: {
        ...prev.imageOptions,
        margin: parseInt(event.target.value, 10) || 0
      }
    }));
  };

  const onTypeNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      qrOptions: {
        ...prev.qrOptions,
        typeNumber: (parseInt(event.target.value, 10) || 0) as TypeNumber
      }
    }));
  };

  const onModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setOptions((prev) => ({
      ...prev,
      qrOptions: {
        ...prev.qrOptions,
        mode: event.target.value as Mode
      }
    }));
  };

  const onErrorCorrectionLevelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setOptions((prev) => ({
      ...prev,
      qrOptions: {
        ...prev.qrOptions,
        errorCorrectionLevel: event.target.value as ErrorCorrectionLevel
      }
    }));
  };

  const onDownload = () => {
    qrCode.download({
      extension: "png"
    });
  };

  const onExportJSON = () => {
    const json = JSON.stringify(options, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "qr-code-options.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const saveToHistory = async () => {
    try {
      const blob = await qrCode.getRawData("png");
      if (blob) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const previewUrl = reader.result as string;
          const newItem: HistoryItem = {
            id: Date.now().toString(),
            options: JSON.parse(JSON.stringify(options)),
            timestamp: Date.now(),
            previewUrl
          };
          setHistory(prev => {
            // Avoid duplicates of the exact same data
            if (prev.length > 0 && prev[0].options.data === options.data && JSON.stringify(prev[0].options) === JSON.stringify(options)) {
              return prev;
            }
            return [newItem, ...prev].slice(0, 10);
          });
        };
        reader.readAsDataURL(blob);
      }
    } catch (error) {
      console.error("Error saving to history:", error);
    }
  };

  const loadDesign = (item: HistoryItem) => {
    setOptions(item.options);
    
    // Update color type states based on the loaded options
    if (item.options.dotsOptions?.gradient) setColorType("gradient");
    else setColorType("single");
    
    if (item.options.cornersSquareOptions?.gradient) setCornerSquareColorType("gradient");
    else setCornerSquareColorType("single");
    
    if (item.options.cornersDotOptions?.gradient) setCornersDotColorType("gradient");
    else setCornersDotColorType("single");
    
    if (item.options.backgroundOptions?.gradient) setBackgroundColorType("gradient");
    else setBackgroundColorType("single");

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${theme === "dark" ? "bg-[#393939] text-white" : "bg-white text-black"}`}>
      {/* Privacy Modal */}
      <AnimatePresence>
        {isPrivacyModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrivacyModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-2xl p-8 sm:p-12 rounded-none border shadow-2xl overflow-y-auto max-h-[90vh] ${theme === "dark" ? "bg-neutral-900 border-neutral-800 text-white" : "bg-white border-neutral-200 text-black"}`}
            >
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className={`absolute top-6 right-6 p-2 transition-colors ${theme === "dark" ? "text-neutral-400 hover:text-white" : "text-neutral-500 hover:text-black"}`}
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-[#d81206]/10 rounded-none">
                  <Shield className="w-8 h-8 text-[#d81206]" />
                </div>
                <h2 className="text-3xl font-light tracking-tight uppercase">Privacy Protection</h2>
              </div>

              <div className="space-y-8 text-sm leading-relaxed">
                <section className="space-y-4">
                  <h3 className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>Local Processing</h3>
                  <p className={theme === "dark" ? "text-neutral-400" : "text-neutral-500"}>
                    Your data is processed entirely within your browser. We do not send your links, text, or images to any server for QR code generation. Everything happens on your device.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>No Tracking</h3>
                  <p className={theme === "dark" ? "text-neutral-400" : "text-neutral-500"}>
                    This application does not use tracking cookies, analytics scripts, or any third-party monitoring tools. Your usage remains completely anonymous.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>Cloud Sync (Optional)</h3>
                  <p className={theme === "dark" ? "text-neutral-400" : "text-neutral-500"}>
                    If you choose to log in, your designs are securely stored in Firebase. We only store your email and the QR configurations you explicitly save. No other personal data is collected.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>Data Persistence</h3>
                  <p className={theme === "dark" ? "text-neutral-400" : "text-neutral-500"}>
                    Unsaved designs remain in your browser's local memory. Once you log out or clear your history, that local data is removed. Cloud-saved designs are only accessible via your authenticated account.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>Secure Connection</h3>
                  <p className={theme === "dark" ? "text-neutral-400" : "text-neutral-500"}>
                    The site is served over a secure HTTPS connection, ensuring that the application code itself is delivered safely to your browser.
                  </p>
                </section>
              </div>

              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="mt-12 w-full py-4 bg-[#d81206] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#b00e05] transition-all"
              >
                I Understand
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Blocked Site Modal */}
      <AnimatePresence>
        {isBlockedModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBlockedModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-md p-10 rounded-none border-2 border-[#d81206] shadow-2xl text-center ${theme === "dark" ? "bg-neutral-900 text-white" : "bg-white text-black"}`}
            >
              <div className="flex flex-col items-center gap-6">
                <div className="p-4 bg-[#d81206]/20 rounded-full">
                  <AlertTriangle className="w-12 h-12 text-[#d81206]" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Access Restricted</h2>
                  <p className={`text-sm font-medium leading-relaxed ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`}>
                    Sites with <span className="text-[#d81206] font-bold">+18 content</span> or <span className="text-[#d81206] font-bold">betting/gambling</span> are not permitted on this platform.
                  </p>
                </div>

                <div className={`p-4 w-full text-[10px] font-mono uppercase tracking-widest border border-dashed ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-neutral-500" : "bg-neutral-50 border-neutral-200 text-neutral-400"}`}>
                  Reason: {blockedReason}
                </div>

                <button
                  onClick={() => setIsBlockedModalOpen(false)}
                  className="w-full py-4 bg-[#d81206] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#b00e05] transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation Menu */}
      <nav className={`px-6 py-4 flex items-center justify-between relative border-b transition-colors duration-500 ${theme === "dark" ? "bg-[#393939] border-neutral-700" : "bg-white border-neutral-200"}`}>
        <div className="flex items-center gap-1 cursor-default select-none">
          <span className="text-4xl font-black tracking-tighter leading-none text-[#d81206]">G</span>
          <div className="flex flex-col justify-center space-y-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] leading-none opacity-80 ${theme === "dark" ? "text-white" : "text-black"}`}>ly</span>
            <span className={`text-[14px] font-extrabold uppercase tracking-tight leading-none ${theme === "dark" ? "text-white" : "text-black"}`}>ph</span>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-8 text-sm font-medium">
          <button
            onClick={() => setIsPrivacyModalOpen(true)}
            className={`hidden md:flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${theme === "dark" ? "text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700" : "text-neutral-500 border-neutral-100 hover:text-black hover:border-neutral-200"}`}
          >
            <Shield className="w-3 h-3 text-[#d81206]" />
            Privacy First
          </button>

          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-white" : "text-black"}`}>{user.displayName}</span>
                <button onClick={logout} className="text-[9px] text-[#d81206] font-bold uppercase tracking-widest hover:underline">Logout</button>
              </div>
              <img src={user.photoURL || ""} alt="Profile" className="w-8 h-8 rounded-full border border-[#d81206]" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="flex items-center gap-2 px-6 py-2 bg-[#d81206] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#b00e05] transition-all"
            >
              Login with Google
            </button>
          )}

          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-300 ${theme === "dark" ? "hover:bg-neutral-800 text-white" : "hover:bg-neutral-100 text-black"}`}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className={`w-full py-20 px-6 md:px-12 lg:px-24 border-b transition-colors duration-500 ${theme === "dark" ? "bg-[#393939] border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}
      >
        <header className="max-w-6xl mx-auto">
          <h1 className={`text-5xl md:text-7xl font-bold tracking-tight mb-6 ${theme === "dark" ? "text-white" : "text-black"}`}>
            Gly<span className="text-[#d81206]">ph</span>
          </h1>
          <div className="space-y-2">
            <p className={`text-xl md:text-2xl font-light ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
              An open source JS library
            </p>
            <p className={`text-xl md:text-2xl font-light ${theme === "dark" ? "text-neutral-500" : "text-neutral-400"}`}>
              For generating styled QR codes
            </p>
          </div>
        </header>
      </motion.div>

      <div className="p-4 md:p-8 lg:p-12">
        <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        {/* Left Column: Options */}
        <motion.section 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-12 p-0 rounded-none shadow-none"
        >
          <div>
            <div className="flex items-center gap-3 mb-10">
              <Settings className="w-6 h-6 text-[#d81206]" />
              <h2 className={`text-2xl font-light tracking-wide uppercase ${theme === "dark" ? "text-white" : "text-black"}`}>Main options</h2>
            </div>

            {/* Privacy Notice Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 mb-10 flex items-center justify-between border ${theme === "dark" ? "bg-neutral-800/50 border-neutral-800" : "bg-neutral-50 border-neutral-100"}`}
            >
              <div className="flex items-center gap-3">
                <Lock className="w-4 h-4 text-[#d81206]" />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                  Your data is processed locally. No information is sent to our servers.
                </span>
              </div>
              <button
                onClick={() => setIsPrivacyModalOpen(true)}
                className="text-[10px] font-bold uppercase tracking-widest text-[#d81206] hover:underline"
              >
                Learn More
              </button>
            </motion.div>

            <div className="space-y-8">
              {/* Data Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="data" className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                    <LinkIcon className="w-4 h-4 text-[#d81206]" />
                    Data (Link or Text)
                  </label>
                  <div className="flex items-center gap-4">
                    {options.data && (
                      <div className="flex items-center gap-1.5">
                        {isValidUrl(options.data) ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-green-500">Valid Link</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500">Invalid Format</span>
                          </>
                        )}
                      </div>
                    )}
                    <button
                      onClick={clearData}
                      className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${theme === "dark" ? "text-neutral-500 hover:text-white" : "text-neutral-400 hover:text-black"}`}
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear
                    </button>
                  </div>
                </div>
                <input
                  id="data"
                  type="text"
                  value={options.data}
                  onChange={onDataChange}
                  placeholder="https://example.com"
                  className={`w-full px-0 py-3 bg-transparent border-b transition-all focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "border-neutral-700 text-white placeholder:text-neutral-500" : "border-neutral-200 text-black placeholder:text-neutral-400"}`}
                />
              </div>

              {/* Image File Input */}
              <div className="space-y-3">
                <label htmlFor="image" className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                  <ImageIcon className="w-4 h-4 text-[#d81206]" />
                  Image File (Logo Central)
                </label>
                <div className="relative">
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={onImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="image"
                    className={`flex items-center justify-start w-full px-0 py-4 bg-transparent border-b cursor-pointer hover:border-[#d81206] transition-all group ${theme === "dark" ? "border-neutral-700" : "border-neutral-200"}`}
                  >
                    <span className={`transition-colors ${theme === "dark" ? "text-neutral-300 group-hover:text-white" : "text-neutral-600 group-hover:text-black"}`}>
                      {options.image ? "Trocar imagem" : "Clique para selecionar uma imagem"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Dimensions & Margin */}
              <div className="grid grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label htmlFor="width" className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                    <Maximize className="w-4 h-4 text-[#d81206]" />
                    Width
                  </label>
                  <input
                    id="width"
                    type="number"
                    value={options.width}
                    onChange={onWidthChange}
                    className={`w-full px-0 py-3 bg-transparent border-b transition-all focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "border-neutral-700 text-white" : "border-neutral-200 text-black"}`}
                  />
                </div>
                <div className="space-y-3">
                  <label htmlFor="height" className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                    <Minimize className="w-4 h-4 text-[#d81206]" />
                    Height
                  </label>
                  <input
                    id="height"
                    type="number"
                    value={options.height}
                    onChange={onHeightChange}
                    className={`w-full px-0 py-3 bg-transparent border-b transition-all focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "border-neutral-700 text-white" : "border-neutral-200 text-black"}`}
                  />
                </div>
                <div className="space-y-3">
                  <label htmlFor="margin" className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                    <Layout className="w-4 h-4 text-[#d81206]" />
                    Margin
                  </label>
                  <input
                    id="margin"
                    type="number"
                    value={options.margin}
                    onChange={onMarginChange}
                    className={`w-full px-0 py-3 bg-transparent border-b transition-all focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "border-neutral-700 text-white" : "border-neutral-200 text-black"}`}
                  />
                </div>
              </div>
            </div>

            {/* Dots Options Collapsible */}
            <div className={`mt-10 pt-10 border-t ${theme === "dark" ? "border-neutral-800" : "border-neutral-100"}`}>
              <button
                onClick={() => setIsDotsOptionsOpen(!isDotsOptionsOpen)}
                className="flex items-center justify-between w-full group"
              >
                <div className="flex items-center gap-3">
                  <CircleDot className="w-6 h-6 text-[#d81206] transition-colors" />
                  <h2 className={`text-xl font-light tracking-wide uppercase group-hover:text-[#d81206] transition-colors ${theme === "dark" ? "text-white" : "text-black"}`}>Dots Options</h2>
                </div>
                {isDotsOptionsOpen ? (
                  <Minus className={`w-5 h-5 ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`} />
                ) : (
                  <Plus className={`w-5 h-5 ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`} />
                )}
              </button>

              {isDotsOptionsOpen && (
                <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Dots Style */}
                  <div className="space-y-3">
                    <label htmlFor="dotsStyle" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                      Dots Style
                    </label>
                    <select
                      id="dotsStyle"
                      value={options.dotsOptions?.type}
                      onChange={onDotTypeChange}
                      className={`w-full px-4 py-3 border rounded-none transition-all appearance-none cursor-pointer focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                    >
                      <option value="square">Square</option>
                      <option value="dots">Dots</option>
                      <option value="rounded">Rounded</option>
                      <option value="extra-rounded">Extra Rounded</option>
                      <option value="classy">Classy</option>
                      <option value="classy-rounded">Classy Rounded</option>
                    </select>
                  </div>

                  {/* Color Type */}
                  <div className="space-y-4">
                    <span className={`text-xs font-bold uppercase tracking-widest block ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>Color Type</span>
                    <div className="flex gap-6">
                      <button
                        onClick={() => onColorTypeChange("single")}
                        className={`flex items-center gap-3 px-6 py-3 rounded-none border transition-all font-bold uppercase tracking-widest text-[10px] ${
                          colorType === "single"
                            ? "bg-[#d81206] text-white border-[#d81206]"
                            : theme === "dark" 
                              ? "bg-transparent text-neutral-300 border-neutral-700 hover:border-neutral-500"
                              : "bg-transparent text-neutral-600 border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        Single Color
                      </button>
                      <button
                        onClick={() => onColorTypeChange("gradient")}
                        className={`flex items-center gap-3 px-6 py-3 rounded-none border transition-all font-bold uppercase tracking-widest text-[10px] ${
                          colorType === "gradient"
                            ? "bg-[#d81206] text-white border-[#d81206]"
                            : theme === "dark"
                              ? "bg-transparent text-neutral-300 border-neutral-700 hover:border-neutral-500"
                              : "bg-transparent text-neutral-600 border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        Color Gradient
                      </button>
                    </div>
                  </div>

                  {/* Dots Color / Gradient Controls */}
                  {colorType === "single" ? (
                    <div className="space-y-3">
                      <label htmlFor="dotsColor" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                        Dots Color
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          id="dotsColor"
                          type="color"
                          value={options.dotsOptions?.color || "#000000"}
                          onChange={onDotsColorChange}
                          className={`w-14 h-14 rounded-none border cursor-pointer p-1 ${theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}
                        />
                        <span className={`text-sm font-mono uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-500"}`}>
                          {options.dotsOptions?.color || "#000000"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Gradient Type */}
                      <div className="space-y-3">
                        <label htmlFor="gradientType" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                          Gradient Type
                        </label>
                        <select
                          id="gradientType"
                          value={options.dotsOptions?.gradient?.type}
                          onChange={onGradientTypeChange}
                          className={`w-full px-4 py-3 border rounded-none transition-all appearance-none cursor-pointer focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                        >
                          <option value="linear">Linear</option>
                          <option value="radial">Radial</option>
                        </select>
                      </div>

                      {/* Gradient Colors */}
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>Color 1</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={options.dotsOptions?.gradient?.colorStops[0].color || "#000000"}
                              onChange={(e) => onGradientColorChange(0, e.target.value)}
                              className={`w-12 h-12 rounded-none border cursor-pointer p-1 ${theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}
                            />
                            <span className={`text-xs font-mono uppercase ${theme === "dark" ? "text-neutral-300" : "text-neutral-500"}`}>
                              {options.dotsOptions?.gradient?.colorStops[0].color}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>Color 2</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={options.dotsOptions?.gradient?.colorStops[1].color || "#ffffff"}
                              onChange={(e) => onGradientColorChange(1, e.target.value)}
                              className={`w-12 h-12 rounded-none border cursor-pointer p-1 ${theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}
                            />
                            <span className={`text-xs font-mono uppercase ${theme === "dark" ? "text-neutral-300" : "text-neutral-500"}`}>
                              {options.dotsOptions?.gradient?.colorStops[1].color}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rotation */}
                      {options.dotsOptions?.gradient?.type === "linear" && (
                        <div className="space-y-3">
                          <label htmlFor="rotation" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                            Rotation (0-360°)
                          </label>
                          <input
                            id="rotation"
                            type="number"
                            min="0"
                            max="360"
                            value={Math.round(((options.dotsOptions?.gradient?.rotation || 0) * 180) / Math.PI)}
                            onChange={onRotationChange}
                            className={`w-full px-4 py-3 border rounded-none transition-all focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Corner Square Options Collapsible */}
            <div className={`mt-10 pt-10 border-t ${theme === "dark" ? "border-neutral-800" : "border-neutral-100"}`}>
              <button
                onClick={() => setIsCornerSquareOptionsOpen(!isCornerSquareOptionsOpen)}
                className="flex items-center justify-between w-full group"
              >
                <div className="flex items-center gap-3">
                  <Square className="w-6 h-6 text-[#d81206] transition-colors" />
                  <h2 className={`text-xl font-light tracking-wide uppercase group-hover:text-[#d81206] transition-colors ${theme === "dark" ? "text-white" : "text-black"}`}>Corner Square Options</h2>
                </div>
                {isCornerSquareOptionsOpen ? (
                  <Minus className={`w-5 h-5 ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`} />
                ) : (
                  <Plus className={`w-5 h-5 ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`} />
                )}
              </button>

              {isCornerSquareOptionsOpen && (
                <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Corner Square Style */}
                  <div className="space-y-3">
                    <label htmlFor="cornerSquareStyle" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                      Corner Square Style
                    </label>
                    <select
                      id="cornerSquareStyle"
                      value={options.cornersSquareOptions?.type}
                      onChange={onCornerSquareTypeChange}
                      className={`w-full px-4 py-3 border rounded-none transition-all appearance-none cursor-pointer focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                    >
                      <option value="">None</option>
                      <option value="square">Square</option>
                      <option value="dot">Dot</option>
                      <option value="extra-rounded">Extra Rounded</option>
                    </select>
                  </div>

                  {/* Color Type */}
                  <div className="space-y-4">
                    <span className={`text-xs font-bold uppercase tracking-widest block ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>Color Type</span>
                    <div className="flex gap-6">
                      <button
                        onClick={() => onCornerSquareColorTypeChange("single")}
                        className={`flex items-center gap-3 px-6 py-3 rounded-none border transition-all font-bold uppercase tracking-widest text-[10px] ${
                          cornerSquareColorType === "single"
                            ? "bg-[#d81206] text-white border-[#d81206]"
                            : theme === "dark"
                              ? "bg-transparent text-neutral-300 border-neutral-700 hover:border-neutral-500"
                              : "bg-transparent text-neutral-600 border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        Single Color
                      </button>
                      <button
                        onClick={() => onCornerSquareColorTypeChange("gradient")}
                        className={`flex items-center gap-3 px-6 py-3 rounded-none border transition-all font-bold uppercase tracking-widest text-[10px] ${
                          cornerSquareColorType === "gradient"
                            ? "bg-[#d81206] text-white border-[#d81206]"
                            : theme === "dark"
                              ? "bg-transparent text-neutral-300 border-neutral-700 hover:border-neutral-500"
                              : "bg-transparent text-neutral-600 border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        Color Gradient
                      </button>
                    </div>
                  </div>

                  {/* Corner Square Color / Gradient Controls */}
                  {cornerSquareColorType === "single" ? (
                    <div className="space-y-3">
                      <label htmlFor="cornerSquareColor" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                        Corner Square Color
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          id="cornerSquareColor"
                          type="color"
                          value={options.cornersSquareOptions?.color || "#000000"}
                          onChange={onCornerSquareColorChange}
                          className={`w-14 h-14 rounded-none border cursor-pointer p-1 ${theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}
                        />
                        <span className={`text-sm font-mono uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-500"}`}>
                          {options.cornersSquareOptions?.color || "#000000"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Gradient Type */}
                      <div className="space-y-3">
                        <label htmlFor="cornerSquareGradientType" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                          Gradient Type
                        </label>
                        <select
                          id="cornerSquareGradientType"
                          value={options.cornersSquareOptions?.gradient?.type}
                          onChange={onCornerSquareGradientTypeChange}
                          className={`w-full px-4 py-3 border rounded-none transition-all appearance-none cursor-pointer focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                        >
                          <option value="linear">Linear</option>
                          <option value="radial">Radial</option>
                        </select>
                      </div>

                      {/* Gradient Colors */}
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>Color 1</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={options.cornersSquareOptions?.gradient?.colorStops[0].color || "#000000"}
                              onChange={(e) => onCornerSquareGradientColorChange(0, e.target.value)}
                              className={`w-12 h-12 rounded-none border cursor-pointer p-1 ${theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}
                            />
                            <span className={`text-xs font-mono uppercase ${theme === "dark" ? "text-neutral-300" : "text-neutral-500"}`}>
                              {options.cornersSquareOptions?.gradient?.colorStops[0].color}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>Color 2</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={options.cornersSquareOptions?.gradient?.colorStops[1].color || "#ffffff"}
                              onChange={(e) => onCornerSquareGradientColorChange(1, e.target.value)}
                              className={`w-12 h-12 rounded-none border cursor-pointer p-1 ${theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}
                            />
                            <span className={`text-xs font-mono uppercase ${theme === "dark" ? "text-neutral-300" : "text-neutral-500"}`}>
                              {options.cornersSquareOptions?.gradient?.colorStops[1].color}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rotation */}
                      {options.cornersSquareOptions?.gradient?.type === "linear" && (
                        <div className="space-y-3">
                          <label htmlFor="cornerSquareRotation" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                            Rotation (0-360°)
                          </label>
                          <input
                            id="cornerSquareRotation"
                            type="number"
                            min="0"
                            max="360"
                            value={Math.round(((options.cornersSquareOptions?.gradient?.rotation || 0) * 180) / Math.PI)}
                            onChange={onCornerSquareRotationChange}
                            className={`w-full px-4 py-3 border rounded-none transition-all focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Corners Dot Options Collapsible */}
            <div className={`mt-10 pt-10 border-t ${theme === "dark" ? "border-neutral-800" : "border-neutral-100"}`}>
              <button
                onClick={() => setIsCornersDotOptionsOpen(!isCornersDotOptionsOpen)}
                className="flex items-center justify-between w-full group"
              >
                <div className="flex items-center gap-3">
                  <Circle className="w-6 h-6 text-[#d81206] transition-colors" />
                  <h2 className={`text-xl font-light tracking-wide uppercase group-hover:text-[#d81206] transition-colors ${theme === "dark" ? "text-white" : "text-black"}`}>Corners Dot Options</h2>
                </div>
                {isCornersDotOptionsOpen ? (
                  <Minus className={`w-5 h-5 ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`} />
                ) : (
                  <Plus className={`w-5 h-5 ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`} />
                )}
              </button>

              {isCornersDotOptionsOpen && (
                <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Corners Dot Style */}
                  <div className="space-y-3">
                    <label htmlFor="cornersDotStyle" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                      Corners Dot Style
                    </label>
                    <select
                      id="cornersDotStyle"
                      value={options.cornersDotOptions?.type}
                      onChange={onCornerDotTypeChange}
                      className={`w-full px-4 py-3 border rounded-none transition-all appearance-none cursor-pointer focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                    >
                      <option value="">None</option>
                      <option value="square">Square</option>
                      <option value="dot">Dot</option>
                    </select>
                  </div>

                  {/* Color Type */}
                  <div className="space-y-4">
                    <span className={`text-xs font-bold uppercase tracking-widest block ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>Color Type</span>
                    <div className="flex gap-6">
                      <button
                        onClick={() => onCornerDotColorTypeChange("single")}
                        className={`flex items-center gap-3 px-6 py-3 rounded-none border transition-all font-bold uppercase tracking-widest text-[10px] ${
                          cornersDotColorType === "single"
                            ? "bg-[#d81206] text-white border-[#d81206]"
                            : theme === "dark"
                              ? "bg-transparent text-neutral-300 border-neutral-700 hover:border-neutral-500"
                              : "bg-transparent text-neutral-600 border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        Single Color
                      </button>
                      <button
                        onClick={() => onCornerDotColorTypeChange("gradient")}
                        className={`flex items-center gap-3 px-6 py-3 rounded-none border transition-all font-bold uppercase tracking-widest text-[10px] ${
                          cornersDotColorType === "gradient"
                            ? "bg-[#d81206] text-white border-[#d81206]"
                            : theme === "dark"
                              ? "bg-transparent text-neutral-300 border-neutral-700 hover:border-neutral-500"
                              : "bg-transparent text-neutral-600 border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        Color Gradient
                      </button>
                    </div>
                  </div>

                  {/* Corners Dot Color / Gradient Controls */}
                  {cornersDotColorType === "single" ? (
                    <div className="space-y-3">
                      <label htmlFor="cornersDotColor" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                        Corners Dot Color
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          id="cornersDotColor"
                          type="color"
                          value={options.cornersDotOptions?.color || "#000000"}
                          onChange={onCornerDotColorChange}
                          className={`w-14 h-14 rounded-none border cursor-pointer p-1 ${theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}
                        />
                        <span className={`text-sm font-mono uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-500"}`}>
                          {options.cornersDotOptions?.color || "#000000"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Gradient Type */}
                      <div className="space-y-3">
                        <label htmlFor="cornersDotGradientType" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                          Gradient Type
                        </label>
                        <select
                          id="cornersDotGradientType"
                          value={options.cornersDotOptions?.gradient?.type}
                          onChange={onCornerDotGradientTypeChange}
                          className={`w-full px-4 py-3 border rounded-none transition-all appearance-none cursor-pointer focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                        >
                          <option value="linear">Linear</option>
                          <option value="radial">Radial</option>
                        </select>
                      </div>

                      {/* Gradient Colors */}
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>Color 1</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={options.cornersDotOptions?.gradient?.colorStops[0].color || "#000000"}
                              onChange={(e) => onCornerDotGradientColorChange(0, e.target.value)}
                              className={`w-12 h-12 rounded-none border cursor-pointer p-1 ${theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}
                            />
                            <span className={`text-xs font-mono uppercase ${theme === "dark" ? "text-neutral-300" : "text-neutral-500"}`}>
                              {options.cornersDotOptions?.gradient?.colorStops[0].color}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>Color 2</label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={options.cornersDotOptions?.gradient?.colorStops[1].color || "#ffffff"}
                              onChange={(e) => onCornerDotGradientColorChange(1, e.target.value)}
                              className={`w-12 h-12 rounded-none border cursor-pointer p-1 ${theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}
                            />
                            <span className={`text-xs font-mono uppercase ${theme === "dark" ? "text-neutral-300" : "text-neutral-500"}`}>
                              {options.cornersDotOptions?.gradient?.colorStops[1].color}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rotation */}
                      {options.cornersDotOptions?.gradient?.type === "linear" && (
                        <div className="space-y-3">
                          <label htmlFor="cornersDotRotation" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                            Rotation (0-360°)
                          </label>
                          <input
                            id="cornersDotRotation"
                            type="number"
                            min="0"
                            max="360"
                            value={Math.round(((options.cornersDotOptions?.gradient?.rotation || 0) * 180) / Math.PI)}
                            onChange={onCornerDotRotationChange}
                            className={`w-full px-4 py-3 border rounded-none transition-all focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Background Options Collapsible */}
            <div className={`mt-10 pt-10 border-t ${theme === "dark" ? "border-neutral-800" : "border-neutral-100"}`}>
              <button
                onClick={() => setIsBackgroundOptionsOpen(!isBackgroundOptionsOpen)}
                className="flex items-center justify-between w-full group"
              >
                <div className="flex items-center gap-3">
                  <Palette className="w-6 h-6 text-[#d81206] transition-colors" />
                  <h2 className={`text-xl font-light tracking-wide uppercase group-hover:text-[#d81206] transition-colors ${theme === "dark" ? "text-white" : "text-black"}`}>Background Options</h2>
                </div>
                {isBackgroundOptionsOpen ? (
                  <Minus className={`w-5 h-5 ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`} />
                ) : (
                  <Plus className={`w-5 h-5 ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`} />
                )}
              </button>

              {isBackgroundOptionsOpen && (
                <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Color Type */}
                  <div className="space-y-4">
                    <span className={`text-xs font-bold uppercase tracking-widest block ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>Color Type</span>
                    <div className="flex gap-6">
                      <button
                        onClick={() => onBackgroundColorTypeChange("single")}
                        className={`flex items-center gap-3 px-6 py-3 rounded-none border transition-all font-bold uppercase tracking-widest text-[10px] ${
                          backgroundColorType === "single"
                            ? "bg-[#d81206] text-white border-[#d81206]"
                            : theme === "dark"
                              ? "bg-transparent text-neutral-300 border-neutral-700 hover:border-neutral-500"
                              : "bg-transparent text-neutral-600 border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        Single Color
                      </button>
                      <button
                        onClick={() => onBackgroundColorTypeChange("gradient")}
                        className={`flex items-center gap-3 px-6 py-3 rounded-none border transition-all font-bold uppercase tracking-widest text-[10px] ${
                          backgroundColorType === "gradient"
                            ? "bg-[#d81206] text-white border-[#d81206]"
                            : theme === "dark"
                              ? "bg-transparent text-neutral-300 border-neutral-700 hover:border-neutral-500"
                              : "bg-transparent text-neutral-600 border-neutral-200 hover:border-neutral-400"
                        }`}
                      >
                        Color Gradient
                      </button>
                    </div>
                  </div>

                  {/* Background Color / Gradient Controls */}
                  {backgroundColorType === "single" ? (
                    <div className="space-y-3">
                      <label htmlFor="backgroundColor" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                        Background Color
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          id="backgroundColor"
                          type="color"
                          value={options.backgroundOptions?.color || "#ffffff"}
                          onChange={onBackgroundColorChange}
                          className={`w-14 h-14 rounded-none border cursor-pointer p-1 ${theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}
                        />
                        <span className={`text-sm font-mono uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-500"}`}>
                          {options.backgroundOptions?.color || "#ffffff"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                      {/* Gradient Type */}
                      <div className="space-y-3">
                        <label htmlFor="backgroundGradientType" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                          Gradient Type
                        </label>
                        <select
                          id="backgroundGradientType"
                          value={options.backgroundOptions?.gradient?.type}
                          onChange={onBackgroundGradientTypeChange}
                          className={`w-full px-4 py-3 border rounded-none transition-all appearance-none cursor-pointer focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                        >
                          <option value="linear">Linear</option>
                          <option value="radial">Radial</option>
                        </select>
                      </div>

                      {/* Gradient Colors */}
                      <div className="space-y-4">
                        <label className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>Background Gradient</label>
                        <div className="grid grid-cols-2 gap-8">
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={options.backgroundOptions?.gradient?.colorStops[0].color || "#ffffff"}
                              onChange={(e) => onBackgroundGradientColorChange(0, e.target.value)}
                              className={`w-12 h-12 rounded-none border cursor-pointer p-1 ${theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}
                            />
                            <span className={`text-xs font-mono uppercase ${theme === "dark" ? "text-neutral-300" : "text-neutral-500"}`}>
                              {options.backgroundOptions?.gradient?.colorStops[0].color}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              value={options.backgroundOptions?.gradient?.colorStops[1].color || "#e2e2e2"}
                              onChange={(e) => onBackgroundGradientColorChange(1, e.target.value)}
                              className={`w-12 h-12 rounded-none border cursor-pointer p-1 ${theme === "dark" ? "bg-neutral-800 border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}
                            />
                            <span className={`text-xs font-mono uppercase ${theme === "dark" ? "text-neutral-300" : "text-neutral-500"}`}>
                              {options.backgroundOptions?.gradient?.colorStops[1].color}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Rotation */}
                      {options.backgroundOptions?.gradient?.type === "linear" && (
                        <div className="space-y-3">
                          <label htmlFor="backgroundRotation" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                            Rotation (0-360°)
                          </label>
                          <input
                            id="backgroundRotation"
                            type="number"
                            min="0"
                            max="360"
                            value={Math.round(((options.backgroundOptions?.gradient?.rotation || 0) * 180) / Math.PI)}
                            onChange={onBackgroundRotationChange}
                            className={`w-full px-4 py-3 border rounded-none transition-all focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Image Options Collapsible */}
            <div className={`mt-10 pt-10 border-t ${theme === "dark" ? "border-neutral-800" : "border-neutral-100"}`}>
              <button
                onClick={() => setIsImageOptionsOpen(!isImageOptionsOpen)}
                className="flex items-center justify-between w-full group"
              >
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-[#d81206] transition-colors" />
                  <h2 className={`text-xl font-light tracking-wide uppercase group-hover:text-[#d81206] transition-colors ${theme === "dark" ? "text-white" : "text-black"}`}>Image Options</h2>
                </div>
                {isImageOptionsOpen ? (
                  <Minus className={`w-5 h-5 ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`} />
                ) : (
                  <Plus className={`w-5 h-5 ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`} />
                )}
              </button>

              {isImageOptionsOpen && (
                <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Hide Background Dots */}
                  <div className="flex items-center gap-4">
                    <input
                      id="hideBackgroundDots"
                      type="checkbox"
                      checked={options.imageOptions?.hideBackgroundDots}
                      onChange={onHideBackgroundDotsChange}
                      className={`w-6 h-6 rounded-none border transition-all cursor-pointer ${theme === "dark" ? "border-neutral-700 bg-neutral-800 text-[#d81206]" : "border-neutral-200 bg-neutral-50 text-[#d81206]"}`}
                    />
                    <label htmlFor="hideBackgroundDots" className={`text-xs font-bold uppercase tracking-widest cursor-pointer ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                      Hide Background Dots
                    </label>
                  </div>

                  {/* Image Size */}
                  <div className="space-y-3">
                    <label htmlFor="imageSize" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                      Image Size (0.1 - 1.0)
                    </label>
                    <input
                      id="imageSize"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="1.0"
                      value={options.imageOptions?.imageSize}
                      onChange={onImageSizeChange}
                      className={`w-full px-4 py-3 border rounded-none transition-all focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                    />
                  </div>

                  {/* Margin */}
                  <div className="space-y-3">
                    <label htmlFor="imageMargin" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                      Margin
                    </label>
                    <input
                      id="imageMargin"
                      type="number"
                      min="0"
                      value={options.imageOptions?.margin}
                      onChange={onImageMarginChange}
                      className={`w-full px-4 py-3 border rounded-none transition-all focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* QR Options Collapsible */}
            <div className={`mt-10 pt-10 border-t ${theme === "dark" ? "border-neutral-800" : "border-neutral-100"}`}>
              <button
                onClick={() => setIsQrOptionsOpen(!isQrOptionsOpen)}
                className="flex items-center justify-between w-full group"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-[#d81206] transition-colors" />
                  <h2 className={`text-xl font-light tracking-wide uppercase group-hover:text-[#d81206] transition-colors ${theme === "dark" ? "text-white" : "text-black"}`}>QR Options</h2>
                </div>
                {isQrOptionsOpen ? (
                  <Minus className={`w-5 h-5 ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`} />
                ) : (
                  <Plus className={`w-5 h-5 ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`} />
                )}
              </button>

              {isQrOptionsOpen && (
                <div className="mt-8 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Type Number */}
                  <div className="space-y-3">
                    <label htmlFor="typeNumber" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                      Type Number (0 - 40)
                    </label>
                    <input
                      id="typeNumber"
                      type="number"
                      min="0"
                      max="40"
                      value={options.qrOptions?.typeNumber}
                      onChange={onTypeNumberChange}
                      className={`w-full px-4 py-3 border rounded-none transition-all focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                    />
                  </div>

                  {/* Mode */}
                  <div className="space-y-3">
                    <label htmlFor="mode" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                      Mode
                    </label>
                    <select
                      id="mode"
                      value={options.qrOptions?.mode}
                      onChange={onModeChange}
                      className={`w-full px-4 py-3 border rounded-none transition-all appearance-none cursor-pointer focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                    >
                      <option value="Numeric">Numeric</option>
                      <option value="Alphanumeric">Alphanumeric</option>
                      <option value="Byte">Byte</option>
                      <option value="Kanji">Kanji</option>
                    </select>
                  </div>

                  {/* Error Correction Level */}
                  <div className="space-y-3">
                    <label htmlFor="errorCorrectionLevel" className={`text-xs font-bold uppercase tracking-widest ${theme === "dark" ? "text-neutral-300" : "text-neutral-600"}`}>
                      Error Correction Level
                    </label>
                    <select
                      id="errorCorrectionLevel"
                      value={options.qrOptions?.errorCorrectionLevel}
                      onChange={onErrorCorrectionLevelChange}
                      className={`w-full px-4 py-3 border rounded-none transition-all appearance-none cursor-pointer focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                    >
                      <option value="L">L</option>
                      <option value="M">M</option>
                      <option value="Q">Q</option>
                      <option value="H">H</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Export JSON Button */}
            <div className={`mt-16 pt-10 border-t flex justify-start ${theme === "dark" ? "border-neutral-800" : "border-neutral-100"}`}>
              <button
                onClick={onExportJSON}
                className="flex items-center gap-2 px-8 py-4 bg-transparent text-[#d81206] border border-[#d81206] rounded-none font-bold uppercase tracking-widest text-xs hover:bg-[#d81206] hover:text-white transition-all active:scale-[0.98]"
              >
                <Settings className="w-4 h-4" />
                Export Options as JSON
              </button>
            </div>

            {/* Contact Info */}
            <div className="mt-10 flex flex-col gap-4">
              <button
                onClick={() => setIsPrivacyModalOpen(true)}
                className={`flex items-center gap-2 text-xs uppercase tracking-widest font-bold hover:text-[#d81206] transition-colors ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`}
              >
                <ShieldCheck className="w-4 h-4" />
                Privacy Policy & Security
              </button>
              <p className={`text-xs uppercase tracking-widest ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`}>
                If you have any questions or issues please contact me via{" "}
                <a href="mailto:matheusinaciio16@gmail.com" className="text-[#d81206] font-bold hover:underline">
                  email
                </a>{" "}
                or{" "}
                <a href="https://github.com/matheusinaciio" target="_blank" rel="noopener noreferrer" className="text-[#d81206] font-bold hover:underline">
                  GitHub Issues
                </a>.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Right Column: Preview */}
        <motion.section 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col items-center justify-center space-y-12 sticky top-12"
        >
          <div className={`relative p-12 rounded-none shadow-none border flex items-center justify-center min-h-[450px] min-w-[450px] transition-colors duration-500 ${theme === "dark" ? "bg-[#393939] border-neutral-700" : "bg-neutral-50 border-neutral-200"}`}>
            <div ref={ref} className="qr-container" />
            
            {/* Blocked Overlay */}
            <AnimatePresence>
              {isDataBlocked && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-4 z-10"
                >
                  <Lock className="w-16 h-16 text-[#d81206]" />
                  <div className="text-center">
                    <p className="text-white font-black uppercase tracking-[0.3em] text-xl">QR Blocked</p>
                    <p className="text-[#d81206] text-[10px] font-bold uppercase tracking-widest mt-2">Restricted Content Detected</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col w-full gap-4 max-w-[450px]">
            <button
              onClick={onDownload}
              className="flex items-center justify-center gap-3 px-12 py-5 bg-[#d81206] text-white rounded-none font-bold uppercase tracking-[0.2em] text-sm hover:bg-[#b00e05] transform transition-all active:scale-95 shadow-none w-full"
            >
              <Download className="w-5 h-5" />
              Download QR Code
            </button>
            
            {user ? (
              <button
                onClick={() => setIsSaveModalOpen(true)}
                className={`flex items-center justify-center gap-3 px-12 py-5 border rounded-none font-bold uppercase tracking-[0.2em] text-sm transform transition-all active:scale-95 shadow-none w-full ${theme === "dark" ? "border-[#d81206] text-white hover:bg-[#d81206]/10" : "border-[#d81206] text-black hover:bg-[#d81206]/5"}`}
              >
                <Save className="w-5 h-5 text-[#d81206]" />
                Save to Cloud
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                className={`flex items-center justify-center gap-3 px-12 py-5 border rounded-none font-bold uppercase tracking-[0.2em] text-sm transform transition-all active:scale-95 shadow-none w-full ${theme === "dark" ? "border-neutral-700 text-neutral-400 hover:bg-neutral-800" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`}
              >
                <Lock className="w-5 h-5 opacity-50" />
                Login to Save
              </button>
            )}

            <button
              onClick={saveToHistory}
              className={`flex items-center justify-center gap-3 px-12 py-5 border rounded-none font-bold uppercase tracking-[0.2em] text-sm transform transition-all active:scale-95 shadow-none w-full ${theme === "dark" ? "border-neutral-700 text-white hover:bg-neutral-800" : "border-neutral-200 text-black hover:bg-neutral-50"}`}
            >
              <History className="w-5 h-5 text-[#d81206]" />
              Add to History
            </button>
          </div>
        </motion.section>
      </main>
    </div>

      {/* History Section */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 lg:px-12 mt-32">
        <div className="flex items-center gap-3 mb-10">
          <History className="w-6 h-6 text-[#d81206]" />
          <h2 className={`text-2xl font-light tracking-wide uppercase ${theme === "dark" ? "text-white" : "text-black"}`}>Recent Designs</h2>
        </div>
        
        {history.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className={`p-20 border-2 border-dashed flex flex-col items-center justify-center gap-6 ${theme === "dark" ? "border-neutral-800 text-neutral-500" : "border-neutral-100 text-neutral-400"}`}
          >
            <EyeOff className="w-16 h-16 opacity-20" />
            <div className="text-center">
              <p className="text-lg font-bold uppercase tracking-[0.2em] mb-2">Create your first QR Code!</p>
              <p className="text-xs uppercase tracking-widest opacity-60">Your saved designs will appear here</p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`group relative border transition-all hover:border-[#d81206] flex flex-col ${theme === "dark" ? "bg-neutral-800/30 border-neutral-800" : "bg-neutral-50 border-neutral-200"}`}
              >
                <div className={`p-6 flex items-center justify-center aspect-square transition-colors ${theme === "dark" ? "bg-neutral-800/50" : "bg-white"}`}>
                  <img src={item.previewUrl} alt="QR Preview" className="w-full h-full object-contain" />
                </div>
                
                <div className="p-6 space-y-4 flex-grow flex flex-col">
                  <div className="flex-grow">
                    <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 opacity-60 ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`}>
                      Data
                    </span>
                    <p className={`text-xs font-mono truncate ${theme === "dark" ? "text-white" : "text-black"}`}>
                      {item.options.data}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadDesign(item)}
                      className="flex-grow py-3 bg-[#d81206] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#b00e05] transition-all"
                    >
                      Load
                    </button>
                    <button
                      onClick={(e) => deleteFromHistory(item.id, e)}
                      className={`p-3 border transition-all ${theme === "dark" ? "border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700" : "border-neutral-200 text-neutral-500 hover:text-black hover:bg-neutral-100"}`}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Saved Glyphs Section */}
      {user && (
        <section className="max-w-6xl mx-auto px-4 md:px-8 lg:px-12 mt-32">
          <div className="flex items-center gap-3 mb-10">
            <Save className="w-6 h-6 text-[#d81206]" />
            <h2 className={`text-2xl font-light tracking-wide uppercase ${theme === "dark" ? "text-white" : "text-black"}`}>My Saved Glyphs</h2>
          </div>
          
          {savedGlyphs.length === 0 ? (
            <div className={`p-20 border-2 border-dashed flex flex-col items-center justify-center gap-6 ${theme === "dark" ? "border-neutral-800 text-neutral-500" : "border-neutral-100 text-neutral-400"}`}>
              <Layout className="w-16 h-16 opacity-20" />
              <div className="text-center">
                <p className="text-lg font-bold uppercase tracking-[0.2em] mb-2">No saved glyphs yet</p>
                <p className="text-xs uppercase tracking-widest opacity-60">Save your designs to access them from any device</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {savedGlyphs.map((glyph, index) => (
                <motion.div
                  key={glyph.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`group relative border transition-all hover:border-[#d81206] flex flex-col ${theme === "dark" ? "bg-neutral-800/30 border-neutral-800" : "bg-neutral-50 border-neutral-200"}`}
                >
                  <div className={`p-6 flex items-center justify-center aspect-square transition-colors ${theme === "dark" ? "bg-neutral-800/50" : "bg-white"}`}>
                    <div className="w-full h-full p-2 bg-white flex items-center justify-center">
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-[8px] font-mono text-neutral-400 uppercase tracking-tighter text-center">
                        {glyph.name}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4 flex-grow flex flex-col">
                    <div className="flex-grow">
                      <h3 className={`text-xs font-bold uppercase tracking-widest truncate ${theme === "dark" ? "text-white" : "text-black"}`}>
                        {glyph.name}
                      </h3>
                      <p className={`text-[10px] font-mono truncate opacity-60 ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"}`}>
                        {glyph.data}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadSavedGlyph(glyph)}
                        className="flex-grow py-3 bg-[#d81206] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#b00e05] transition-all"
                      >
                        Load
                      </button>
                      <button
                        onClick={(e) => handleDeleteGlyph(glyph.id!, e)}
                        className={`p-3 border transition-all ${theme === "dark" ? "border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-700" : "border-neutral-200 text-neutral-500 hover:text-black hover:bg-neutral-100"}`}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Save Modal */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSaveModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-md p-10 rounded-none border shadow-2xl ${theme === "dark" ? "bg-neutral-900 border-neutral-800 text-white" : "bg-white border-neutral-200 text-black"}`}
            >
              <h2 className="text-2xl font-light tracking-tight uppercase mb-8">Save Glyph to Cloud</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Glyph Name</label>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="e.g., My Website QR"
                    className={`w-full px-4 py-4 border rounded-none transition-all focus:outline-none focus:border-[#d81206] ${theme === "dark" ? "bg-neutral-800 border-neutral-700 text-white" : "bg-neutral-50 border-neutral-200 text-black"}`}
                    autoFocus
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsSaveModalOpen(false)}
                    className={`flex-grow py-4 border font-bold uppercase tracking-widest text-[10px] transition-all ${theme === "dark" ? "border-neutral-700 text-neutral-400 hover:text-white" : "border-neutral-200 text-neutral-500 hover:text-black"}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveGlyph}
                    disabled={!saveName || isSaving}
                    className="flex-grow py-4 bg-[#d81206] text-white font-bold uppercase tracking-widest text-[10px] hover:bg-[#b00e05] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save Now"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 bg-[#d81206] text-white flex items-center gap-4 shadow-2xl border border-white/20"
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-white/20 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.footer 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className={`py-12 text-center text-xs uppercase tracking-[0.3em] border-t mt-32 transition-colors duration-500 ${theme === "dark" ? "bg-[#393939] text-neutral-400 border-neutral-800" : "bg-neutral-50 text-neutral-500 border-neutral-200"}`}
      >
        <div className="max-w-6xl mx-auto">
          &copy; 2024 <span className={`${theme === "dark" ? "text-neutral-200" : "text-neutral-900"}`}>Denys Kozak</span>
        </div>
      </motion.footer>
    </div>
  );
}
