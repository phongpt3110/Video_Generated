/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import {
  Box,
  VStack,
  Textarea,
  HStack,
  AbsoluteCenter,
  Button,
  createListCollection,
  useBreakpointValue,
  Flex,
  Text,
  Image,
  FileUpload,
  Input,
  InputGroup,
  Spinner,
  CloseButton
} from "@chakra-ui/react";
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "@/components/ui/select";
import { useColorModeValue } from "@/components/ui/color-mode";
import { Field } from "@/components/ui/field";
import { LuSend, LuFileUp, LuImage, LuClock,  LuMusic } from "react-icons/lu";
import { Toaster, toaster } from '@/components/ui/toaster';
import { RiChatVoiceAiLine } from "react-icons/ri";

import { useNavigate } from 'react-router';
import api from "@/api";
import { useAtom } from "jotai";
import {
  accessTokenAtom,
  loadingAtom,
  logoutAtom,
} from "@/atoms/authAtom.js";
import MessageWelcome from "@/components/MessageWelcome";

const ratios = createListCollection({
  items: [
    { label: "16:9", value: "169" },
    { label: "9:16", value: "916" },
    { label: "1:1", value: "11" },
  ],
});

const durations = createListCollection({
  items: [
    { label: "15s", value: 15 },
    { label: "30s", value: 30 },
    { label: "45s", value: 45 },
    { label: "60s", value: 60 },
  ],
});

const voices = createListCollection({
  items: [
    { label: "Ash", value: "ash" },
    { label: "Onyx", value: "onyx" },
    { label: "Alloy", value: "alloy" },
    { label: "Ballad", value: "ballad" },
    { label: "Coral", value: "coral" },
  ]
})

const VideoCreatePage = () => {
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("");
  const [duration, setDuration] = useState("");
  const [file, setFile] = useState(null);
  const [voice, setVoice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdVideo, setCreatedVideo] = useState(null); // Lưu video vừa tạo
  const [mediaUrls, setMediaUrls] = useState({}); // Lưu URL của video, images, audio

  const navigate = useNavigate();
  const buttonColor = useColorModeValue('black', 'white');

  const [accessToken] = useAtom(accessTokenAtom);
  const [loading, ] = useAtom(loadingAtom);
  const [, logout] = useAtom(logoutAtom);

  // const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Fetch media URLs for the created video
  useEffect(() => {
    if (!createdVideo) return;

    const fetchMediaUrls = async () => {
      const newUrls = {};

      // Log createdVideo để kiểm tra dữ liệu
      console.log("Created Video:", JSON.stringify(createdVideo, null, 2));
      // Fetch video
      if(createdVideo._id) {
        try {
          console.log(`Fetching video for ID: ${createdVideo._id}`);
          const videoResponse = await api.get(`/video/download/${createdVideo._id}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            responseType: 'blob',
          });
          newUrls[`video-${createdVideo._id}`] = URL.createObjectURL(videoResponse.data);
          console.log(`Video URL created: ${newUrls[`video-${createdVideo._id}`]}`);
        } catch (error) {
          console.error(`Failed to load video ${createdVideo._id}:`, error.response?.data || error.message);
        }
      } else {
        console.error("Cannot fetch video: createdVideo._id is undefined");
      }

      // Fetch images
      if (Array.isArray(createdVideo.images) && createdVideo.images.length > 0) {
        for (const image of createdVideo.images) {
          if (image._id) {
            try {
              console.log(`Fetching image for ID: ${image._id}`);
              const imageResponse = await api.get(`/video/download/image/${image._id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                responseType: "blob",
              });
              newUrls[`image-${image._id}`] = URL.createObjectURL(imageResponse.data);
              console.log(`Image URL created: ${newUrls[`image-${image._id}`]}`);
            } catch (error) {
              console.error(`Failed to load image ${image._id}:`, error.response?.data || error.message);
            }
          }
        }
      }

      setMediaUrls(newUrls);
    };

    fetchMediaUrls();

    return () => {
      Object.values(mediaUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [createdVideo, accessToken, mediaUrls]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!prompt || !ratio || !duration || !file) {
      toaster.create({
        title: 'Missing Fields',
        description: 'Please fill in all fields!',
        type: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    setCreatedVideo(null); // Reset video trước khi tạo mới

    const formData = new FormData();
    formData.append('prompt', prompt);
    const durationValue = Array.isArray(duration) ? duration[0] : duration;
    formData.append('duration', durationValue);
    if (file) {
      formData.append('music', file);
    }

    let width, height;
    if (ratio === "169") {
      width = 1280;
      height = 720;
    } else if (ratio === "916") {
      width = 720;
      height = 1280;
    } else if (ratio === "11") {
      width = 1080;
      height = 1080;
    } else {
      toaster.create({
        title: 'Invalid Ratio',
        description: 'Please select a valid ratio!',
        type: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsSubmitting(false);
      return;
    }
    formData.append('width', width);
    formData.append('height', height);

    try {
      console.log("Sending data to backend:", { prompt, duration, width, height, file });
      const response = await api.post('/video/generate-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log("Response from backend:", JSON.stringify(response.data, null, 2));

      toaster.create({
        title: 'Video Generated',
        description: 'Your video has been generated successfully.',
        type: 'success',
        duration: 3000,
        isClosable: true,
      });

      setCreatedVideo(response.data); // Lưu video vừa tạo
      setPrompt("");
      setRatio("");
      setDuration("");
      setFile(null);
      
    } catch (error) {
      console.error("Error submitting form:", error.response?.data || error.message);
      toaster.create({
        title: 'Generation Error',
        description: error.response?.data?.message || 'An unexpected error occurred. Please try again.',
        type: 'error',
        duration: 3000,
        isClosable: true,
      });

      if (error.response?.status === 401) {
        await logout();
        navigate("/login", { state: { error: "Session expired, please login again" } });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minH="100vh"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box display="flex" position="relative" minH="100vh">
      <Toaster />
      <Box
        flex="1"
        transition="margin 0.3s ease"
        position="relative"
        minH="100vh"
        width={isMobile ? "100%" : "70%"}
      >
        <AbsoluteCenter axis="both" w="full">
          <VStack spacing={4} w="full" h="100vh">
            <Box
              flex="1"
              overflowY="auto"
              w="full"
              p={4}
              whiteSpace="pre-wrap"
              wordBreak="break-word"
              borderRadius="md"
            >
              {createdVideo ? (
                <Box borderWidth="1px" borderRadius="lg" p={4}>
                  <Text fontWeight="bold" fontSize="lg" mb={2}>
                    Generated Video
                  </Text>

                  {/* Display Video */}
                  <Box>
                    <Text fontWeight="medium">Video:</Text>
                    {createdVideo._id && mediaUrls[`video-${createdVideo._id}`] ? (
                      <Box>
                        <video controls width="100%">
                          <source src={mediaUrls[`video-${createdVideo._id}`]} type="video/mp4" />
                          Your browser does not support the video element.
                        </video>
                      </Box>
                    ) : (
                      <Text>No video available (ID: {createdVideo._id || "undefined"})</Text>
                    )}
                  </Box>

                  {/* Display Images */}
                  <Box>
                    <Text fontWeight="medium">Images:</Text>
                    {Array.isArray(createdVideo.images) && createdVideo.images.length > 0 ? (
                      <Flex gap={2} flexWrap="wrap">
                        {createdVideo.images.map((image, imgIndex) => (
                          <Box key={image._id || imgIndex}>
                            <Image
                              loading="lazy"
                              src={mediaUrls[`image-${image._id}`] }
                              alt={`Generated Image ${imgIndex + 1}`}
                              boxSize="200px"
                              objectFit="cover"
                              
                            />
                          </Box>
                        ))}
                      </Flex>
                    ) : (
                      <Text>No images available</Text>
                    )}
                  </Box>

                  <Box>
                    <Text fontWeight="medium">Generated Text:</Text>
                    {createdVideo.generatedText ? (
                      <Text>{createdVideo.generatedText.content || "No generated text available"}</Text>
                    ) : (
                      <Text>No generated text available</Text>
                    )}
                  </Box>
                </Box>
              ) : (
                <Text textAlign="center" color="gray.500">
                  <MessageWelcome/>
                </Text>
              )}
            </Box>

            <Box
              w="full"
              position="sticky"
              boxShadow="xl"
              borderRadius="xl"
              mb="6"
              bg="white"
              overflow="hidden"
              _dark={{
                bg: "gray.800",
              }}
            >
              <form onSubmit={handleSubmit}>
                <HStack>
                  <Field flex="1">
                    <Textarea
                      placeholder="Enter your prompt to video"
                      lineHeight="tall"
                      variant="none"
                      maxH="150px"
                      autoresize
                      fontSize="16px"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      required
                    />
                  </Field>
                </HStack>

                <HStack p={2} spacing={4} justifyContent="space-between">
                  <Box
                    width={["30%"]}
                    transition="all 0.2s ease"
                    _hover={{ "& > div": { boxShadow: "md", bg: "gray.100" } }}
                  >
                    <SelectRoot
                      required
                      collection={durations}
                      value={duration || ""}  
                      onValueChange={(e) => {
                        const newValue = e.value;
                        setDuration(newValue); 
                      }}
                    >
                      <SelectTrigger
                        transition="all 0.2s ease"
                        paddingLeft="2.2rem"
                        position="relative"
                      >
                        <Box position="absolute" left="0.75rem" top="50%" transform="translateY(-50%)">
                          <LuClock size="18px" /> 
                        </Box>
                        <SelectValueText placeholder="Duration" />
                      </SelectTrigger>
                      <SelectContent >
                        {durations.items.map((option) => (
                          <SelectItem item={option} key={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot> 
                  </Box>
                  {/* Select radio  */}
                  <Box
                    width={"30%"}
                    transition="all 0.2s ease"
                    _hover={{ "& > div": { boxShadow: "md", bg: "gray.100" } }}
                  >
                    <SelectRoot
                      required
                      collection={ratios}
                      value={ratio ? [ratio] : []}
                      onValueChange={(e) => {
                        const selectedRatio = Array.isArray(e.value) ? e.value[0] : e.value;
                        setRatio(selectedRatio);
                      }}
                    >
                       <SelectTrigger
                          transition="all 0.2s ease"
                          paddingLeft="2rem"  // chừa chỗ icon
                          position="relative"
                        >
                          <Box position="absolute" left="8px" top="50%" transform="translateY(-50%)">
                            <LuImage size={16} />
                          </Box>
                          <SelectValueText placeholder="Ratio" />
                        </SelectTrigger>
                      <SelectContent>
                        {ratios.items.map((option) => (
                          <SelectItem item={option} key={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Box>

                  {/* Select voice  */}
                  <Box
                    width={"30%"}
                    transition="all 0.2s ease"
                    _hover={{ "& > div": { boxShadow: "md", bg: "gray.100" } }}
                  >
                    <SelectRoot
                      required
                      collection={voices}
                      value={voice || " "}
                      onValueChange={(e) => {
                        const selectedVoice = e.value;
                        setVoice(selectedVoice)
                      }}
                    >
                      <SelectTrigger
                        transition="all 0.2s ease"
                        paddingLeft="2rem"  
                        position="relative"
                      >
                        <Box position="absolute" left="8px" top="50%" transform="translateY(-50%)">
                            <RiChatVoiceAiLine  size="18px" />
                        </Box>
                        <SelectValueText placeholder="Voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {voices.items.map((option) => (
                          <SelectItem
                            item={option} key={option.value}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Box>

                  <Button
                    p={3}
                    cursor="pointer"
                    onClick={handleSubmit}
                    isDisabled={isSubmitting}
                    opacity={isSubmitting ? 0.5 : 1}
                    transition="all 0.2s ease"
                    color={buttonColor}
                    bg="transparent"
                    _hover={{
                      color: "blue.500",
                      transform: "scale(1.1)",
                    }}
                  >
                    {isSubmitting ? <Spinner size="sm" /> : <LuSend />}
                  </Button>
                </HStack>

                <HStack pb={2} px={2} spacing={4} justifyContent="space-between">
                <Box
                    width={"30%"}
                    marginEnd="auto"
                    transition="all 0.2s ease"
                    _hover={{ "& > div": { boxShadow: "md", bg: "gray.100" } }}
                  >
                    <FileUpload.Root
                      gap="1"
                      value={file ? [file] : []}
                      accept={[".mp3", ".wav", ".ogg"]}
                      onChange={(e) => {
                        const selectedFile = e.target.files[0];
                        setFile(selectedFile);
                      }}
                      required
                    > 
                      <FileUpload.HiddenInput />
                      <Flex 
                        transition="all 0.2s ease"
                        paddingLeft="2rem"  // chừa chỗ icon
                        position="relative"
                      >
                        <Box position="absolute" left="8px" top="50%" transform="translateY(-50%)">
                          <LuMusic size="18px" />
                        </Box>
                        <InputGroup
                          // startElement={}
                          endElement={
                            <FileUpload.ClearTrigger asChild>
                              <CloseButton
                                me="-1"
                                size="xs"
                                variant="plain"
                                focusVisibleRing="inside"
                                focusRingWidth="2px"
                                pointerEvents="auto"
                              />
                            </FileUpload.ClearTrigger>
                          }
                        >
                          <Input asChild>
                            <FileUpload.Trigger>
                              <FileUpload.FileText lineClamp={1} />
                            </FileUpload.Trigger>
                          </Input>
                        </InputGroup>
                      </Flex>
                    </FileUpload.Root>
                  </Box>
                </HStack>
                
              </form>
            </Box>
          </VStack>
        </AbsoluteCenter>
      </Box>
    </Box>
  );
};

export default VideoCreatePage;