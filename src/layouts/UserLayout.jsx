import { Flex, Box, Center, Spinner } from "@chakra-ui/react";
import { Outlet } from "react-router";
import { Suspense } from "react";
import VideoListPage from "@/pages/VideoListPage";
// import SidebarUser from "@/components/SidebarUser";

const UserLayout = () => {
  return (
    <Suspense fallback={<Center><Spinner size="xl" color="blue.500" /></Center>}>
      <Flex h="100vh">
        {/* Sidebar trái */}
        {/* <Box w="10%" bg="gray.100" p={4}>
          <SidebarUser />
        </Box> */}

        {/* Nội dung động ở giữa */}
        <Box w="30%" bg="white" p={4}>
          <Outlet/>
        </Box>

        {/* Video list cố định */}
        <Box w="70%" bg="gray.50" p={4} overflowY="hidden">
          <VideoListPage />
        </Box>
      </Flex>
    </Suspense>
  );
};

export default UserLayout;
