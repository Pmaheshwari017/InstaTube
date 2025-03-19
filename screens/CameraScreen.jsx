import { AntDesign, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Video } from "expo-av";
import * as MediaLibrary from "expo-media-library";
import useThemeStore from "../store/themeStore"; // Import the theme store

export default function CameraScreen() {
  const [facing, setFacing] = useState("back");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] =
    useMicrophonePermissions();
  const [videoUri, setVideoUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const cameraRef = useRef(null);
  const timerRef = useRef(null);
  const { theme, toggleTheme } = useThemeStore(); // Get theme and toggle function

  const uploadMutation = useMutation({
    mutationFn: async ({ videoUri, supabaseFileName }) => {
      const fileName = videoUri.split("/").pop();
      const newPath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: videoUri,
        to: newPath,
      });

      // Upload the video to Supabase Storage
      const uploadResponse = await FileSystem.uploadAsync(
        `https://yedwgdujzvheonypppzd.supabase.co/storage/v1/object/videos/${supabaseFileName}`,
        newPath,
        {
          headers: {
            Authorization: `Bearer YOUR_SUPABASE_TOKEN`,
            "Content-Type": "video/mp4",
          },
          httpMethod: "POST",
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        }
      );

      // Clean up the copied file
      await FileSystem.deleteAsync(newPath);

      return uploadResponse;
    },
    onSuccess: (data) => {
      Alert.alert("Success", "Video uploaded successfully!", [{ text: "OK" }]);
      console.log("Uploaded Video URL:", data.body);
    },
    onError: (error) => {
      console.error("Error uploading video:", error);
      Alert.alert(
        "Upload Failed",
        "An error occurred while uploading the video. Please try again.",
        [{ text: "OK" }]
      );
    },
  });

  if (!cameraPermission || !microphonePermission) {
    return <View />;
  }

  if (!cameraPermission.granted || !microphonePermission.granted) {
    return (
      <View
        style={[styles.container1, theme === "dark" && styles.darkBackground]}
      >
        <View style={[styles.card, theme === "dark" && styles.darkCard]}>
          <FontAwesome
            name="camera"
            size={50}
            color={theme === "dark" ? "#ffffff" : "#000000"}
            style={styles.icon}
          />
          <Text style={[styles.title, theme === "dark" && styles.darkText]}>
            Permission Request
          </Text>
          <Text
            style={[styles.description, theme === "dark" && styles.darkText]}
          >
            We need your permission to access your camera and microphone in
            order to provide the best experience.
          </Text>
          <Button
            onPress={async () => {
              await requestCameraPermission();
              await requestMicrophonePermission();
            }}
            title="Grant Permission"
            color={theme === "dark" ? "#007bff" : "#0000ff"}
          />
        </View>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const handleStartRecording = async () => {
    if (cameraRef.current) {
      if (!microphonePermission.granted) {
        Alert.alert(
          "Permission Required",
          "Microphone permission is required to record video."
        );
        return;
      }

      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);

      try {
        const options = {
          maxDuration: 60,
          quality: "720p",
        };
        const recordedVideo = await cameraRef.current.recordAsync(options);
        console.log("Recorded Video URI:", recordedVideo.uri);
        setVideoUri(recordedVideo.uri);
      } catch (error) {
        console.error("Error recording video:", error);
        Alert.alert("Error", "Failed to record video. Please try again.");
      } finally {
        setIsRecording(false);
        clearInterval(timerRef.current);
      }
    }
  };

  const handleStopRecording = async () => {
    if (cameraRef.current && isRecording) {
      try {
        await cameraRef.current.stopRecording();
        console.log("Recording stopped successfully.");
      } catch (error) {
        console.error("Error stopping recording:", error);
        Alert.alert("Error", "Failed to stop recording. Please try again.");
      } finally {
        setIsRecording(false);
        clearInterval(timerRef.current);
      }
    }
  };

  const handleUploadVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Error", "Permission to access media library is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleUploadToSupabase = async () => {
    if (!videoUri) {
      Alert.alert("Error", "No video to upload.");
      return;
    }

    const supabaseFileName = `video_${Date.now()}.mp4`;
    uploadMutation.mutate({ videoUri, supabaseFileName });
  };

  const saveVideo = async () => {
    try {
      if (!videoUri) {
        Alert.alert("Error", "No video to save.");
        return;
      }

      await MediaLibrary.saveToLibraryAsync(videoUri);
      Alert.alert("Success", "Video saved to your gallery!", [{ text: "OK" }]);
    } catch (error) {
      console.error("Error saving video:", error);
      Alert.alert(
        "Save Failed",
        "An error occurred while saving the video. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  if (videoUri) {
    return (
      <View
        style={[styles.container, theme === "dark" && styles.darkBackground]}
      >
        <Video
          source={{ uri: videoUri }}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="cover"
          shouldPlay
          isLooping
          style={styles.video}
        />
        <View style={styles.previewButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.previewButton,
              theme === "dark" && styles.darkButton,
            ]}
            onPress={() => setVideoUri(null)}
          >
            <Text
              style={[
                styles.previewButtonText,
                theme === "dark" && styles.darkText,
              ]}
            >
              Retry
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.previewButton,
              theme === "dark" && styles.darkButton,
            ]}
            onPress={handleUploadToSupabase}
          >
            <Text
              style={[
                styles.previewButtonText,
                theme === "dark" && styles.darkText,
              ]}
            >
              Upload
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.previewButton,
              theme === "dark" && styles.darkButton,
            ]}
            onPress={saveVideo}
          >
            <Text
              style={[
                styles.previewButtonText,
                theme === "dark" && styles.darkText,
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        {uploadMutation.isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loaderText}>Uploading video...</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, theme === "dark" && styles.darkBackground]}>
      <CameraView
        mode={"video"}
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, theme === "dark" && styles.darkButton]}
            onPress={toggleCameraFacing}
          >
            <AntDesign
              name="retweet"
              size={44}
              color={theme === "dark" ? "#ffffff" : "#000000"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, theme === "dark" && styles.darkButton]}
            onPress={isRecording ? handleStopRecording : handleStartRecording}
          >
            {isRecording ? (
              <FontAwesome5
                name={"stop-circle"}
                size={44}
                color={theme === "dark" ? "#ffffff" : "#000000"}
              />
            ) : (
              <AntDesign
                name={"camera"}
                size={44}
                color={theme === "dark" ? "#ffffff" : "#000000"}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, theme === "dark" && styles.darkButton]}
            onPress={handleUploadVideo}
          >
            <AntDesign
              name="upload"
              size={44}
              color={theme === "dark" ? "#ffffff" : "#000000"}
            />
          </TouchableOpacity>
        </View>
        {isRecording && (
          <View style={styles.timerContainer}>
            <Text
              style={[styles.timerText, theme === "dark" && styles.darkText]}
            >
              {`${Math.floor(recordingTime / 60)}:${(recordingTime % 60)
                .toString()
                .padStart(2, "0")}`}
            </Text>
          </View>
        )}
      </CameraView>

      {/* Theme Toggle Button */}
      <TouchableOpacity onPress={toggleTheme} style={styles.themeToggleButton}>
        <Text style={styles.themeToggleText}>
          Switch to {theme === "light" ? "Dark" : "Light"} Mode
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  darkBackground: {
    backgroundColor: "#121212",
  },
  darkText: {
    color: "#ffffff",
  },
  darkButton: {
    backgroundColor: "#333",
  },
  darkCard: {
    backgroundColor: "#333",
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
    marginHorizontal: 10,
    backgroundColor: "gray",
    borderRadius: 10,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  timerContainer: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    padding: 10,
    borderRadius: 5,
  },
  timerText: {
    color: "white",
    fontSize: 20,
  },
  previewButtonsContainer: {
    position: "absolute",
    bottom: 50,
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  previewButton: {
    padding: 15,
    borderRadius: 10,
  },
  previewButtonText: {
    color: "white",
    fontSize: 16,
  },
  loaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: "#000",
  },
  container1: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
  },
  card: {
    width: "80%",
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    alignItems: "center",
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  themeToggleButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
  },
  themeToggleText: {
    color: "#ffffff",
    fontSize: 16,
  },
});
