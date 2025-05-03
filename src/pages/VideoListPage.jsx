import {
  Box,
  VStack,
  Flex,
  Text,
  Image,
  Button,
  Spinner,
  Group,
  Input,
  Dialog, 
  Portal,
  // InputRightElement,
} from "@chakra-ui/react";

import { Tooltip } from "@/components/ui/tooltip"
import { FaSearch } from "react-icons/fa";
import { MdClear } from "react-icons/md";
import { LuMenu } from "react-icons/lu";
import { BiRefresh } from "react-icons/bi";
import { Toaster, toaster } from '@/components/ui/toaster';

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from 'react-router';
import { Infomation } from "@/components/user/Infomation";
import api from "@/api";
import { useAtom } from "jotai";
import { accessTokenAtom, logoutAtom, } from "@/atoms/authAtom.js";
import { videosAtom, mediaUrlsAtom, loadingMediaAtom, isFetchingAtom, refreshTriggerAtom, loadingAtom } from "@/atoms/videoAtom.js";
import { userAtom } from "@/atoms/userAtom";

const VideoListPage = () => {
  const [videos, setVideos] = useAtom(videosAtom);
  const [mediaUrls, setMediaUrls] = useAtom(mediaUrlsAtom);
  const [loadingMedia, setLoadingMedia] = useAtom(loadingMediaAtom); 
  const [refreshTrigger, setRefreshTrigger] = useAtom(refreshTriggerAtom);
  const [isFetching, setIsFetching] = useAtom(isFetchingAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [,setUser] = useAtom(userAtom)
  const [deletingVideos, setDeletingVideos] = useState({});


  const [searchTerm, setSearchTerm] = useState("");
  const [attemptedVideos, setAttemptedVideos] = useState({});

  const navigate = useNavigate();

  const [accessToken] = useAtom(accessTokenAtom);
  const [, logout] = useAtom(logoutAtom);

  // Fetch danh sách video
  const fetchUserVideos = useCallback(async () => {
    try {
      if (!accessToken) {
        navigate('/login', { state: { error: "Please login to continue" } });
        return;
      }
      setLoading(true);
      setIsFetching(true);

      const response = await api.get('/video/user-videos', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log("Videos from backend:", response.data);
      
      // Kiểm tra phản hồi từ backend
      if (Array.isArray(response.data)) {
        setVideos(response.data);
        setAttemptedVideos({}); // Reset attempted videos
      } else {
        console.error("Invalid response data format:", response.data);
        toaster.create({
          title: "Data Error",
          description: "Received invalid data format from server",
          type: "error",
          duration: 3000,
          isClosable: true,
        });
        setVideos([]);
      }
    } catch (error) {
      console.error("Error fetching user videos:", error.response?.data || error.message);
      // Thông báo khi load thất bại
      toaster.create({
        title: "Fetch Error",
        description: "Failed to load videos. Please try again.",
        type: "error",
        duration: 3000,
        isClosable: true,
      });

      if (error.response?.status === 401) {
        await logout();
        navigate("/login", { state: { error: "Session expired, please login again" } });
      }
      
      // Set videos to empty array on error
      setVideos([]);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [accessToken]);

  // Fetch media (video, images, generateText) cho từng video
  const fetchMediaForVideo = useCallback(async (video) => {
    if (!video || !video._id) {
      return;
    }
    
    // Kiểm tra xem video đã được tải chưa
    if (loadingMedia[`video-${video._id}`] || attemptedVideos[`video-${video._id}`]) {
      return;
    }

    // Danh dấu video đã được tải or thử tải
    setLoadingMedia(prev => ({ ...prev, [`video-${video._id}`]: true }));
    setAttemptedVideos(prev => ({ ...prev, [video._id]: true })); 
    try {
      // Video URL fetch
      if (video._id) {
        try {
          const videoResponse = await api.get(`/video/download/${video._id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            responseType: 'blob',
            timeout: 60000, // Tăng timeout lên 60 giây
          });

          if (videoResponse.data.size > 0) {
            const videoUrl = URL.createObjectURL(videoResponse.data);
            setMediaUrls(prev => ({ ...prev, [`video-${video._id}`]: videoUrl }));
          } else {
            console.warn(`Video data is empty for ID: ${video._id}`);
          }
        } catch (videoError) {
          console.error(`Failed to load video ${video._id}:`, videoError.response?.data || videoError.message);
        }
      }

      // Fetch images
      if (Array.isArray(video.images)) {
        for (const image of video.images) {
          if (image && image._id) {
            try {
              const imageResponse = await api.get(`/video/download/image/${image._id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                responseType: "blob",
                timeout: 10000,
              });
              if (imageResponse.data.size > 0) {
                setMediaUrls(prev => ({
                  ...prev,
                  [`image-${image._id}`]: URL.createObjectURL(imageResponse.data)
                }));
              }
            } catch (imageError) {
              console.error(`Failed to load image ${image._id}:`, imageError.response?.data || imageError.message);
            }
          }
        }
      }
    } catch (error) {
      console.error(`General error fetching media for video ${video._id}:`, error);
    } finally {
      setLoadingMedia(prev => ({ ...prev, [`video-${video._id}`]: false }));
    }
  }, [accessToken, mediaUrls, loadingMedia, attemptedVideos,]);

  // Retry fetching a specific video
  const retryFetchVideo = useCallback((video) => {
    setAttemptedVideos(prev => {
      const updated = {...prev};
      delete updated[video._id];
      return updated;
    });
    
    // Clear any existing URL
    setMediaUrls(prev => {
      const updated = {...prev};
      delete updated[`video-${video._id}`];
      return updated;
    });
    
    // Fetch the video again
    fetchMediaForVideo(video);
  }, [fetchMediaForVideo, setMediaUrls]);
  
  // Fetch videos khi component mount hoặc khi refreshTrigger thay đổi
  useEffect(() => {
    if (accessToken) { 
      fetchUserVideos();
    }
    // Cleanup function 
    return () => {
      setVideos([]);
      setIsFetching(false);
    };
  }, [fetchUserVideos, refreshTrigger]);

    // Process videos one at a time to avoid race conditions
  useEffect(() => {
    if (videos.length === 0 || isFetching) return;
    
    const pendingVideos = videos.filter(video => 
      video && 
      video._id && 
      !mediaUrls[`video-${video._id}`] && 
      !loadingMedia[`video-${video._id}`] &&
      !attemptedVideos[video._id]
    );
    
    if (pendingVideos.length > 0) {
      fetchMediaForVideo(pendingVideos[0]);
    }
  }, [videos, mediaUrls, loadingMedia, attemptedVideos, isFetching, fetchMediaForVideo]);

  // Cleanup URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(mediaUrls).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  //Fetch infomation
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!accessToken) {
          navigate('/login',{ state : { error:"Please login to continue" }})
          return
        }
        const response = await api.get('/user/me', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        // console.log("User data from backend:", response.data);
        if (response.data.success) {
          setUser(response.data.data);
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        console.error("Error fetching user:", error.message);
        toaster.create({
          title: "Fetch User Error",
          description: "Failed to load user information. Please try again.",
          type: "error",
          duration: 3000,
          isClosable: true,
        });
        if (error.response?.status === 401) {
          await logout();
          navigate("/login", { state: { error: " " } });
        }
      }
    }
    fetchUser();
  }, [accessToken, navigate, setUser, logout])


  // Xóa từ khóa tìm kiếm
  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  // Search videos based on filename or generated text
  const filteredVideos = useMemo(() => {
    if (!searchTerm.trim()) return videos;

    return videos.filter(video => {
      // Theo file name
      if(video.filename && video.filename.toLowerCase().includes(searchTerm.toLowerCase())) {
        return true;
      }
        // Tìm kiếm theo nội dung text được sinh ra
      if (video.generatedText && video.generatedText.content && 
          video.generatedText.content.toLowerCase().includes(searchTerm.toLowerCase())) {
        return true;
      }
      return false;
    })
  }, [videos, searchTerm,]);

  const handleDeleteVideo = async (videoId) => {
    setDeletingVideos((prev) => ({ ...prev, [videoId]: true }));
    try {
      await api.delete(`/video/${videoId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      toaster.create({
        title: "Thành công",
        description: "Xóa video thành công.",
        type: "success",
        duration: 3000,
      });
      fetchUserVideos();
    } catch (error) {
      console.error("Error deleting video:", error);
      toaster.create({
        title: "Lỗi",
        description: "Không thể xóa video.",
        type: "error",
        duration: 3000,
      });
    } finally {
      setDeletingVideos((prev) => ({ ...prev, [videoId]: false }));
    }
  }

  const videoList = useMemo(() => {
    return filteredVideos && filteredVideos.length > 0 ? (  
      <VStack spacing={6} align="stretch">
        {filteredVideos.map((video, videoIndex) => (
          <Box key={video._id || videoIndex} borderWidth="1px" borderRadius="lg" p={4}>
            <Text fontWeight="bold" fontSize="lg" mb={2}>
              Video {videoIndex + 1} {video.filename ? `- ${video.filename}` : ''}
            </Text>

            {/* Hiển thị hình ảnh */}
            <Box>
              <Text fontWeight="medium">Images:</Text>
              {video.images && video.images.length > 0 ? (
                <Flex gap={5} flexWrap="wrap">
                  {video.images.map((image, imgIndex) => (
                    <Box key={image._id || imgIndex} position="relative">
                      <Image
                        loading="lazy"
                        src={mediaUrls[`image-${image._id}`]}
                        alt={`Generated Image ${imgIndex + 1}`}
                        boxSize="220px"
                        borderRadius="md"
                        objectFit="cover"
                        _hover={{transform: 'scale(1.05)', transition: 'transform 0.2s ease' }}
                        fallback={<Box boxSize="200px" bg="gray.100" display="flex" alignItems="center" justifyContent="center"><Text color="gray.500">Loading...</Text></Box>}
                      />
                      {mediaUrls[`image-${image._id}`] && (
                          <Button
                            as="a"
                            href={mediaUrls[`image-${image._id}`]}
                            download={image.filename || `image-${imgIndex}.jpg`}
                            size="sm"
                            position="absolute"
                            bottom="2"
                            right="2"
                            variant="ghost"
                          >
                            <Text fontSize="xs">Download</Text>
                          </Button>
                      )}
                    </Box>
                  ))}
                </Flex>
              ) : (
                <Text>No images available</Text>
              )}
            </Box>
              {/* Hiển thị video */}
            <Box mt={4}>
              <Text fontWeight="medium">Video:</Text>
              {video.filename ? (
                loadingMedia[`video-${video._id}`] ? (
                  <Flex direction="column" alignItems="center" justifyContent="center" h="200px" bg="gray.100" borderRadius="md">
                    <Spinner size="md"/>
                    <Text mt={2} color='black'>Loading video...</Text>
                  </Flex>
                ) : mediaUrls[`video-${video._id}`] ? (
                  <Box>
                    <video 
                      key={`video-player-${video._id}`}
                      controls 
                      width="100%" 
                      onError={() => retryFetchVideo(video)} // Retry fetching video on error
                    >
                      <source src={mediaUrls[`video-${video._id}`]} type="video/mp4" />
                      Your browser does not support the video element.
                    </video>
                    <Button
                      as="a"
                      href={mediaUrls[`video-${video._id}`]}
                      download={video.filename || `video-${videoIndex}.mp4`}
                      size="sm"
                      _hover={{ bg: "black.100" }}
                      mt={2}
                    >
                      Download Video
                    </Button>
                    <Dialog.Root>
                      <Dialog.Trigger asChild>
                        <Button variant="outline" bg="red.600" float="right" size="sm" mt={2} color="white" >
                          Delete Video
                        </Button>
                      </Dialog.Trigger>
                      <Portal>
                        <Dialog.Backdrop />
                        <Dialog.Positioner>
                          <Dialog.Content>
                            <Dialog.Header>
                              <Dialog.Title>CONFIRM VIDEO DELETION</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                              <p>
                              You confirm to delete the video (named) with (mb). If you accept, please text OK
                              </p>
                            </Dialog.Body>
                            <Dialog.Footer>
                              <Dialog.ActionTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </Dialog.ActionTrigger>
                              <Button
                                bg="red.500"
                                _hover={{ bg: "red.300" }}
                                onClick={()=> handleDeleteVideo(video._id)}
                                isLoading={deletingVideos[video._id] || false}
                              >OK</Button>
                            </Dialog.Footer>
                          </Dialog.Content>
                        </Dialog.Positioner>
                      </Portal>
                    </Dialog.Root>
                  </Box>
                ) : (
                  <Box>
                    <Text>Video: {video.filename} {attemptedVideos[video._id] ? "(Failed to load)" : "(Waiting...)"}</Text>
                    <Button
                      onClick={() => retryFetchVideo(video)}
                      size="sm"
                      mt={2}
                      colorScheme="blue"
                    >
                      {attemptedVideos[video._id] ? "Retry" : "Load Video"}
                    </Button>
                  </Box>
                )
              ) : (
                <Text>No video available</Text>
              )}
            </Box>
              {/* Hiển thị generateText */}
            <Box mt={4}>
              <Text fontWeight="medium">Generated Text:</Text>
              {video.generatedText ? (
                <Text whiteSpace="pre-wrap">{video.generatedText.content || "No generated text available"}</Text>
              ) : (
                <Text>No generated text available</Text>
              )}
            </Box>
          </Box>
        ))}
      </VStack>
    ) : (
      <Box textAlign="center" p={10} borderWidth="1px" borderRadius="lg">
        {searchTerm ? (
          // Hiển thị khi tìm kiếm không có kết quả
          <VStack spacing={4}>
            <Text color="gray.500">
              No videos found matching &quot;<strong>{searchTerm}</strong>&quot;
            </Text>
            <Button
              colorScheme="blue"
              onClick={clearSearch}
            >
              Clear Search
            </Button>
          </VStack>
        ) : (
          // Hiển thị khi không có video nào
          <Text color="gray.500" mb={4}>
            No videos available. Create a new video to get started!
          </Text>
        )}
        {!searchTerm && (
          <Button
            colorScheme="blue"
            onClick={() => navigate('/video/create')}
          >
            Create New Video
          </Button>
        )}
      </Box>
    );
  }, [filteredVideos, searchTerm, mediaUrls, loadingMedia, attemptedVideos, navigate, retryFetchVideo, clearSearch]);

  return (
    <Box display="flex" position="relative" minH="100vh">
      <Toaster />
      <Flex position="absolute" top="4" right="4" zIndex="100" align="center" gap="2">
          <Group startElement={<FaSearch  />}>
            <Input 
              placeholder="Search videos" 
              color='black' 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              pr="4.5rem"
            />
            {/* Thêm icon tìm kiếm */}
            <Button width="4.5rem" h={"2.5rem"}>
              <Flex>
                {searchTerm ? (
                  <Button h="1.75rem" size="xl" onClick={clearSearch} mr="1">
                    <MdClear />
                  </Button>
                ) : <FaSearch color="gray.300" />}
              </Flex>
            </Button>
          </Group>
        <Tooltip content="Thông tin người dùng" openDelay={400} >
          <Infomation />
        </Tooltip>
      </Flex>

      <Box
        flex="1"
        transition="margin 0.3s ease"
        position="relative"
        minH="100vh"
        bg="gray.100"
      >
        <Box w="full" mx="auto" my={4}>
          <VStack spacing={4} w="full">
            <Flex justifyContent="space-between" w="full" mb={4}>
            <Tooltip content="Làm mới" openDelay={400} >
                <Button
                  onClick={() => {
                    setRefreshTrigger(prev => prev + 1)
                    setSearchTerm("");
                  }}
                  colorScheme="blue"
                  variant="normal"  
                  bg="transparent"
                  _hover={{ color: "blue.500" }}
                  leftIcon={<LuMenu />}
                >
                  <BiRefresh />
                  {isFetching && <Spinner size="sm" />}
                </Button>
              </Tooltip>
            </Flex>
            <Box
              w="full"
              p={4}
              whiteSpace="pre-wrap"
              wordBreak="break-word"
              borderRadius="md"
              overflowY="auto"
              maxH="85vh"
            >
            {loading ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                minH="50vh"
              >
                <VStack>
                  <Spinner size="xl" />
                  <Text mt={4}>Loading videos...</Text>
                </VStack>
              </Box>
            ) : (
              videoList
            )}
            </Box>
          </VStack>
        </Box>
      </Box>
    </Box>
  );
};

export default VideoListPage;