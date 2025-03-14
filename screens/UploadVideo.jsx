import React, { useState } from 'react';
import { View, Button } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../utils/supabase';

export default function UploadVideo({ route }) {
  const { videoUri } = route.params;

  const handleUpload = async () => {
    const file = await FileSystem.readAsStringAsync(videoUri, { encoding: 'base64' });
    const { data, error } = await supabase.storage.from('videos').upload(`video-${Date.now()}.mp4`, file);
    if (error) alert(error.message);
    else alert('Upload successful!');
  };

  return (
    <View>
      <Button title="Upload Video" onPress={handleUpload} />
    </View>
  );
}