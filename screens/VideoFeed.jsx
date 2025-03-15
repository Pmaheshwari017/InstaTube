import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons"; // For icons
import { supabase } from "../utils/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native"; // For focus detection

export default function VideoFeed() {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleVideoIndex, setVisibleVideoIndex] = useState(null); // Track the currently visible video
  const [isRefreshing, setIsRefreshing] = useState(false); // Track refresh state
  const videoRefs = useRef([]); // Refs to control video playback
  const queryClient = useQueryClient(); // Access the query client

  // Fetch videos using Tanstack Query
  const {
    data: supaVideos = [],
    isLoading,
    isError,
    refetch, // Function to manually refetch data
  } = useQuery({
    queryKey: ["videos"], // Unique key for this query
    queryFn: async () => {
      console.log("await supabase.storage: ", supabase.storage);
      console.log("supabase: ", JSON.stringify(supabase, null, 2));
      const { data, error } = await supabase.storage
        .from("videos") // Replace with your bucket name
        .list(); // List all files in the bucket

      console.log("data: ", JSON.stringify(data, null, 2));
      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Map the data to the required format
      return data.map((file) => {
        const publicUrl = supabase.storage
          .from("videos")
          .getPublicUrl(file.name).data.publicUrl;

        return {
          video_url: publicUrl,
          title: file.name,
          user: "tapin_fyp", // Replace with actual user data if available
          description: "Fast Duo - Appono", // Replace with actual description if available
        };
      });
    },
  });

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true); // Show refresh indicator
    await refetch(); // Refetch data
    setIsRefreshing(false); // Hide refresh indicator
  };

  // Trigger refresh when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true; // Track if the screen is still focused

      if (isActive) {
        handleRefresh(); // Refresh data when the screen gains focus
      }

      return () => {
        isActive = false; // Cleanup when the screen loses focus
      };
    }, [])
  );

  // Filter videos based on search query
  const filteredVideos = supaVideos.filter((video) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      video.title.toLowerCase().includes(searchLower) ||
      video.user.toLowerCase().includes(searchLower) ||
      video.description.toLowerCase().includes(searchLower)
    );
  });

  // Handle visibility change
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const visibleIndex = viewableItems[0].index; // Get the index of the first visible item
      setVisibleVideoIndex(visibleIndex); // Update the visible video index
    }
  }).current;

  // Play/pause videos based on visibility
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video && index === visibleVideoIndex) {
        video.playAsync(); // Play the visible video
      } else if (video) {
        video.pauseAsync(); // Pause all other videos
      }
    });
  }, [visibleVideoIndex]);

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Render error state
  if (isError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Failed to fetch videos. Please try again.
        </Text>
      </View>
    );
  }

  const renderItem = ({ item, index }) => {
    return (
      <View style={styles.videoContainer}>
        <Video
          ref={(ref) => (videoRefs.current[index] = ref)} // Assign ref to each video
          source={{ uri: item.video_url }} // Use the URL from Supabase
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="cover"
          shouldPlay={false} // Do not autoplay initially
          isLooping
          style={styles.video}
          useNativeControls={false} // Disable native controls for custom UI
        />
        {/* Overlay UI */}
        <View style={styles.overlay}>
          <View style={styles.userInfo}>
            <View>
              <Text style={styles.userName}>{item.user}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.iconContainer}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="heart" size={30} color="white" />
              <Text style={styles.iconText}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="chatbubble" size={30} color="white" />
              <Text style={styles.iconText}>Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="share-social" size={30} color="white" />
              <Text style={styles.iconText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        placeholder="Search videos..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={{ padding: 10, borderBottomWidth: 1 }}
      />

      <FlatList
        data={filteredVideos} // Use filtered videos
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        pagingEnabled // Enable paging
        snapToInterval={Dimensions.get("window").height} // Snap interval set to screen height
        snapToAlignment="start" // Snap to the start of the item
        decelerationRate="fast" // Make scrolling feel snappier
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ marginBottom: 50, paddingBottom: 60 }}
        onViewableItemsChanged={onViewableItemsChanged} // Track visible items
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50, // Consider an item visible if 50% of it is on screen
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing} // Show refresh indicator
            onRefresh={handleRefresh} // Trigger refresh
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: Dimensions.get("window").height, // Set height to full screen
  },
  video: {
    width: "100%",
    height: "100%", // Fill the container
  },
  overlay: {
    position: "absolute",
    bottom: 150,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
  },
  userName: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  description: {
    color: "white",
    fontSize: 14,
    marginTop: 5,
  },
  followButton: {
    borderWidth: 1,
    borderColor: "white",
    paddingHorizontal: 15,
    alignItems: "center",
    paddingTop: 10,
    borderRadius: 5,
    marginTop: 10,
    marginLeft: 20,
  },
  followButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    alignSelf: "center",
  },
  iconContainer: {
    alignItems: "center",
  },
  iconButton: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconText: {
    color: "white",
    fontSize: 12,
    marginTop: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});
