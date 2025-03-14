import React from "react";
import { Video } from "expo-av";

export default function VideoPlayer({ uri }) {
  return (
    <Video
      source={{ uri }}
      rate={1.0}
      volume={1.0}
      isMuted={true}
      resizeMode="cover"
      shouldPlay
      isLooping
      style={{ width: "100%", height: 300 }}
    />
  );
}
