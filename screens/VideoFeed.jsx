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
  Alert,
  Share,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Button,
} from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../utils/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";

export default function VideoFeed() {
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleVideoIndex, setVisibleVideoIndex] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState("");

  const videoRefs = useRef([]);

  // Fetch videos using Tanstack Query
  const {
    data: supaVideos = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("videos").list();

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((file) => {
        const publicUrl = supabase.storage
          .from("videos")
          .getPublicUrl(file.name).data.publicUrl;

        return {
          video_url: publicUrl,
          title: file.name,
          user: "tapin_fyp",
          description: "Fast Duo - Appono",
        };
      });
    },
  });

  // Refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Trigger refresh when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      handleRefresh();
      return () => {
        videoRefs.current.forEach((video, index) => {
          if (video.pauseAsync()) {
            video.pauseAsync();
          }
        });
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
      const visibleIndex = viewableItems[0].index;
      setVisibleVideoIndex(visibleIndex);
    }
  }).current;

  // Play/pause videos based on visibility
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video && index === visibleVideoIndex) {
        video.playAsync();
      } else if (video) {
        video.pauseAsync();
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

  const handleLike = () => {
    setLiked(!liked);
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: "Check out this awesome post!",
        url: "https://instatube.com",
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          Alert.alert("Shared successfully!");
        } else {
          Alert.alert("Shared successfully!");
        }
      } else if (result.action === Share.dismissedAction) {
        Alert.alert("Sharing dismissed");
      }
    } catch (error) {
      Alert.alert("Error sharing:", error.message);
    }
  };
  const handleComment = () => {
    setCommentModalVisible(true);
  };

  const handleSendComment = () => {
    if (commentText.trim()) {
      Alert.alert("Comment Sent!", `Your comment: ${commentText}`);
      setCommentText("");
      setCommentModalVisible(false);
    } else {
      Alert.alert("Error", "Please write a comment before sending.");
    }
  };

  const renderItem = ({ item, index }) => {
    return (
      <View style={styles.videoContainer}>
        <Video
          ref={(ref) => (videoRefs.current[index] = ref)}
          source={{ uri: item.video_url }}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="cover"
          shouldPlay={false}
          isLooping
          style={styles.video}
          useNativeControls={false}
        />
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
            <TouchableOpacity style={styles.iconButton} onPress={handleLike}>
              <Ionicons
                name={liked ? "heart" : "heart-outline"}
                size={30}
                color={liked ? "red" : "white"}
              />
              <Text style={styles.iconText}>{liked ? "Unlike" : "Like"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleComment}>
              <Ionicons name="chatbubble" size={30} color="white" />
              <Text style={styles.iconText}>Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
              <Ionicons name="share-social" size={30} color="white" />
              <Text style={styles.iconText}>Share</Text>
            </TouchableOpacity>
          </View>
          <Modal
            visible={commentModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setCommentModalVisible(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalContainer}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add a Comment</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Write your comment..."
                  multiline
                  value={commentText}
                  onChangeText={setCommentText}
                />
                <View style={styles.modalButtons}>
                  <Button
                    title="Cancel"
                    onPress={() => setCommentModalVisible(false)}
                  />
                  <Button title="Send" onPress={handleSendComment} />
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      </View>
    );
  };
  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#888"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search videos..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearIcon}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredVideos}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        pagingEnabled // Enable paging
        snapToInterval={Dimensions.get("window").height}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ marginBottom: 50, paddingBottom: 60 }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
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
    height: Dimensions.get("window").height,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 200,
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

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  commentInput: {
    height: 100,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  clearIcon: {
    marginLeft: 10,
  },
});
