import { Flex, Box, Center, Spinner } from "@chakra-ui/react";
import { Outlet } from "react-router";
import { Suspense } from "react";
import SidebarAdmin from "@/components/admin/SidebarAdmin";

const AdminLayout = () => {
  return (
    <Suspense fallback={<Center><Spinner size="xl" color="blue.500" /></Center>}>
      <Flex h="100vh">
          {/* Sidebar trái */}
          <Box  shadow='lg' m='2' borderRadius='4xl' borderColor="blue.800">
            <SidebarAdmin />
          </Box>
          {/* Nội dung động ở giữa */}
          <Box w="80%" bg="white" >
            <Outlet/>
          </Box>
      </Flex>
    </Suspense>
  );
};

export default AdminLayout;
