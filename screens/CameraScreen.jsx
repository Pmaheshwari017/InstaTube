import { AntDesign, FontAwesome5 } from "@expo/vector-icons";
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
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZHdnZHVqenZoZW9ueXBwcHpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTY5ODYzNCwiZXhwIjoyMDU3Mjc0NjM0fQ.ce_fKpo5Y7FbBAKZEtQxeJgh7LM3X6AzYoQpRA5cM5s`,
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
        clearInterval(timerRef.current);
      }
    }
  };

  // Handle uploading a video from the gallery
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

  // Handle uploading video to Supabase
  const handleUploadToSupabase = async () => {
    if (!videoUri) {
      Alert.alert("Error", "No video to upload.");
      return;
    }

    const supabaseFileName = `video_${Date.now()}.mp4`;
    uploadMutation.mutate({ videoUri, supabaseFileName });
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
            onPress={() => setVideoUri(null)}
          >
            <Text style={styles.previewButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={handleUploadToSupabase}
          >
            <Text style={styles.previewButtonText}>Upload</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.previewButton} onPress={saveVideo}>
            <Text style={styles.previewButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Loader while uploading */}
        {uploadMutation.isLoading && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.loaderText}>Uploading video...</Text>
          </View>
        )}
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
});
