import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';

export default function LikeButton({ videoId }) {
  const [liked, setLiked] = useState(false);

  const handleLike = async () => {
    setLiked(!liked);
    // Add logic to update likes in the backend
  };

  return (
    <TouchableOpacity onPress={handleLike}>
      <Text>{liked ? '❤️' : '🤍'}</Text>
    </TouchableOpacity>
  );
}