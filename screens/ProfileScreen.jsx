import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { supabase } from '../utils/supabase';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profile) {
        setUsername(profile.username);
        setBio(profile.bio);
      }
    };
    fetchUser();
  }, []);

  const handleUpdateProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username, bio });
    if (error) alert(error.message);
    else alert('Profile updated!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Email: {user?.email}</Text>
      <Text style={styles.label}>Username:</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Enter your username"
      />
      <Text style={styles.label}>Bio:</Text>
      <TextInput
        style={styles.input}
        value={bio}
        onChangeText={setBio}
        placeholder="Enter your bio"
      />
      <Button title="Update Profile" onPress={handleUpdateProfile} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, marginTop: 10 },
  input: { borderWidth: 1, padding: 10, marginTop: 5, borderRadius: 5 },
});