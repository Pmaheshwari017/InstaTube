import { AntDesign, FontAwesome5 } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import {
  Alert,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Video } from "expo-av";
import { shareAsync } from "expo-sharing";
import * as MediaLibrary from "expo-media-library";

export default function CameraScreen() {
  const [facing, setFacing] = useState("back");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] =
    useMicrophonePermissions();
  const [photo, setPhoto] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  console.log("videoUri: ", videoUri);
  const [saved, setSaved] = useState();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const cameraRef = useRef(null);
  const timerRef = useRef(null);

  // Check if both camera and microphone permissions are granted
  if (!cameraPermission || !microphonePermission) {
    // Permissions are still loading.
    return <View />;
  }

  if (!cameraPermission.granted || !microphonePermission.granted) {
    // Permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to use the camera and microphone.
        </Text>
        <Button
          onPress={async () => {
            await requestCameraPermission();
            await requestMicrophonePermission();
          }}
          title="Grant Permission"
        />
      </View>
    );
  }

  // Toggle between front and back camera
  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  // Handle starting video recording
  const handleStartRecording = async () => {
    if (cameraRef.current) {
      // Ensure microphone permission is granted
      if (!microphonePermission.granted) {
        Alert.alert(
          "Permission Required",
          "Microphone permission is required to record video."
        );
        return;
      }

      setIsRecording(true);
      setRecordingTime(0); // Reset timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1); // Increment timer every second
      }, 1000);

      try {
        const options = {
          maxDuration: 60, // 60 seconds max
          quality: "720p", // Video quality
        };
        const recordedVideo = await cameraRef.current.recordAsync(options);
        console.log("Recorded Video URI:", recordedVideo.uri);
        setVideoUri(recordedVideo.uri);
      } catch (error) {
        console.error("Error recording video:", error);
        Alert.alert("Error", "Failed to record video. Please try again.");
      } finally {
        setIsRecording(false);
        clearInterval(timerRef.current); // Stop the timer
      }
    }
  };

  // Handle stopping video recording
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
        clearInterval(timerRef.current); // Stop the timer
      }
    }
  };

  // Handle uploading a video from the gallery
  const handleUploadVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  };

  // Save video to the media library
  const saveVideo = async () => {
    try {
      if (!videoUri) {
        Alert.alert("Error", "No video to save.");
        return;
      }

      // Save the video to the media library
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

  // Render the video player if a video is recorded/uploaded
  if (videoUri) {
    return (
      <View style={styles.container}>
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
            style={styles.previewButton}
            onPress={() => setVideoUri(null)} // Retry recording
          >
            <Text style={styles.previewButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => {
              Alert.alert("Upload", "Video uploaded successfully!");
            }}
          >
            <Text style={styles.previewButtonText}>Upload</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.previewButton} onPress={saveVideo}>
            <Text style={styles.previewButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Render the camera interface
  return (
    <View style={styles.container}>
      <CameraView
        mode={"video"}
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <AntDesign name="retweet" size={44} color="black" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={isRecording ? handleStopRecording : handleStartRecording}
          >
            {isRecording ? (
              <FontAwesome5 name={"stop-circle"} size={44} color="black" />
            ) : (
              <AntDesign name={"camera"} size={44} color="black" />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleUploadVideo}>
            <AntDesign name="upload" size={44} color="black" />
          </TouchableOpacity>
        </View>
        {isRecording && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>
              {`${Math.floor(recordingTime / 60)}:${(recordingTime % 60)
                .toString()
                .padStart(2, "0")}`}
            </Text>
          </View>
        )}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
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
});
