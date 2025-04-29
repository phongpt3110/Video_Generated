import {
  Box,
  Heading,
  Flex,
  VStack,
  Button,
  Input,
  Table,
  IconButton,
  Spinner,
} from "@chakra-ui/react";
import { HeaderAdmin } from "@/components/admin/HeaderAdmin";
import SidebarAdmin from "@/components/admin/SidebarAdmin";
import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { accessTokenAtom } from "@/atoms/authAtom";
import { 
  videosAtom, 
  videosLoadingAtom, 
  totalPagesAtom,
} from "@/atoms/videoAtom";
import api from "@/api";
import { toaster } from "@/components/ui/toaster";
import { FaEye, FaDownload, FaTrash } from "react-icons/fa";

// Utility to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Utility to format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// Chỉnh sửa lưu state vào Atom
const VideoManagement = () => {
  const [accessToken] = useAtom(accessTokenAtom);
  const [videos, setVideos] = useAtom(videosAtom);
  const [loading, setLoading] = useAtom(videosLoadingAtom);
  const [totalPages, setTotalPages] = useAtom(totalPagesAtom);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const videosPerPage = 10;

  // Filtering states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Deleting state
  const [deletingVideos, setDeletingVideos] = useState({});

  // --- Fetch Videos ---
  const fetchVideos = async () => {
    try {
      setLoading(true); // Start loading
      const response = await api.get("/video/all", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          page: currentPage,
          limit: videosPerPage,
          startDate,
          endDate,
          search: searchTerm,
        },
      });
      console.log("API Response:", response.data);
      const { formattedVideos: fetchedVideos, total } = response.data;
      setVideos(fetchedVideos || []);
      setTotalPages(Math.ceil(total / videosPerPage));
    } catch (error) {
      console.error("Error fetching videos:", error);
      toaster.create({
        title: "Lỗi",
        description: "Không thể lấy danh sách video.",
        type: "error",
        duration: 3000,
      });
    } finally {
      setLoading(false); // End loading
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchVideos();
    }
  }, [startDate, endDate, searchTerm, accessToken]);

  // --- Handle Delete Video with Confirmation ---
  const handleDeleteVideo = async (videoId) => {
    const video = videos.find((v) => v._id === videoId);
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa video "${video?.filename || "này"}"? Hành động này không thể hoàn tác.`
    );
    if (!confirmed) return;

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
      fetchVideos(); // Refresh the list
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
  };

  // --- Handle Download Video ---
  const handleDownloadVideo = async (videoId, filename) => {
    try {
      const response = await api.get(`/video/download/${videoId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading video:", error);
      toaster.create({
        title: "Lỗi",
        description: "Không thể tải video.",
        type: "error",
        duration: 3000,
      });
    }
  };

  // --- Handle Preview Video ---
  const handlePreviewVideo = (videoId) => {
    const videoUrl = `${api.defaults.baseURL}/video/${videoId}`;
    window.open(videoUrl, "_blank");
  };

  // --- Handle Filtering ---
  const handleFilter = async () => {
    setCurrentPage(1);      // Reset trang về 1
    await fetchVideos();    // Gọi API
  };

  return (
    <Flex h="100vh" bg="white">
      {/* Thanh nav */}
      <Box shadow="xs" m="2" borderRadius="4xl" borderColor="blue.800">
        <SidebarAdmin />
      </Box>

      {/* Thông tin cụ thể */}
      <Box flex="1" p={6}>
        <VStack spacing={6}>
          {/* Header với tìm kiếm */}
          <Heading size="lg" mb={4} w="full">
            <HeaderAdmin
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onSearch={handleFilter}
            />
          </Heading>

          {/* Bộ lọc */}
          <Flex gap={4} w="full" mb={4}>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Ngày bắt đầu"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Ngày kết thúc"
            />
            <Button colorScheme="blue" onClick={handleFilter} isDisabled={loading}>
              {loading ? <Spinner size="sm" /> : "Lọc"}
            </Button>
          </Flex>

          {/* Bảng danh sách video */}
          <Box flex="1" w="full" overflowX="auto">
            {loading ? (
              <Flex justify="center" align="center" h="200px">
                <Spinner size="lg" />
              </Flex>
            ) : (
              <Table.Root variant="simple">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Người Dùng</Table.ColumnHeader>
                    <Table.ColumnHeader>Video</Table.ColumnHeader>
                    <Table.ColumnHeader>Thời gian tạo</Table.ColumnHeader>
                    <Table.ColumnHeader>Số lượng hình ảnh</Table.ColumnHeader>
                    <Table.ColumnHeader>Thời lượng</Table.ColumnHeader>
                    <Table.ColumnHeader>Kích thước</Table.ColumnHeader>
                    <Table.ColumnHeader>Tổng Kích Thước Sử Dụng</Table.ColumnHeader>
                    <Table.ColumnHeader>Hành động</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {videos.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={8} textAlign="center">
                        Không có video nào để hiển thị.
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    videos.map((video) => (
                      <Table.Row key={video._id}>
                        <Table.Cell>{video.user || "Unknown"}</Table.Cell>
                        <Table.Cell>{video.filename}</Table.Cell>
                        <Table.Cell>{formatDate(video.createdAt)}</Table.Cell>
                        <Table.Cell>{video.images?.length || 0}</Table.Cell>
                        <Table.Cell>{video.duration || "Không xác định"} giây</Table.Cell>
                        <Table.Cell>{formatFileSize(video.size || 0)}</Table.Cell>
                        <Table.Cell>
                          {formatFileSize(video.userTotalSize)} ({video.userVideoCount} video)
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap={2}>
                            <IconButton
                              aria-label="Tải xuống"
                              size="xs"
                              color="green.600"
                              bg="transparent"
                              _hover={{ bg: "green.100" }}
                              onClick={() => handleDownloadVideo(video._id, video.filename)}
                            >
                              <FaDownload size={12}/>
                            </IconButton>
                            <IconButton
                              size="xs"
                              color="blue.600"
                              bg="transparent"
                              _hover={{ bg: "blue.100" }}
                              aria-label="Xem trước"
                              onClick={() => handlePreviewVideo(video._id)}
                            >
                              <FaEye size={12}/>
                            </IconButton>
                            <IconButton
                              aria-label="Xóa"
                              size="xs"
                              color="red.600"
                              bg="transparent"
                              _hover={{ bg: "red.100" }}
                              onClick={() => handleDeleteVideo(video._id)}
                              isLoading={deletingVideos[video._id] || false}
                              isDisabled={deletingVideos[video._id]}
                            >
                              <FaTrash size={12}/>
                            </IconButton>
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            )}
          </Box>

          {/* Phân trang */}
          <Flex justifyContent="center" mt={4} gap={2}>
            {Array.from({ length: totalPages }, (_, index) => (
              <Button
                key={index}
                size="sm"
                onClick={() => setCurrentPage(index + 1)}
                variant={currentPage === index + 1 ? "solid" : "outline"}
                colorScheme={currentPage === index + 1 ? "blue" : "gray"}
              >
                {index + 1}
              </Button>
            ))}
          </Flex>
        </VStack>
      </Box>
    </Flex>
  );
};

export default VideoManagement;