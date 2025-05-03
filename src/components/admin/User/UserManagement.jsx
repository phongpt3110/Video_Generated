/* eslint-disable react-hooks/exhaustive-deps */
import { 
  Box, Heading, Flex, VStack, Button 
} from "@chakra-ui/react"

import { toaster } from "@/components/ui/toaster";

import { HeaderAdmin } from '@/components/admin/HeaderAdmin';
// import SidebarAdmin from "@/components/admin/SidebarAdmin";
import TableUser from "@/components/admin/User/TableUser";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import api from "@/api";
import { useAtom } from "jotai";
import { accessTokenAtom } from "@/atoms/authAtom";


const UserManagement = () => {
  const [accessToken] = useAtom(accessTokenAtom);
  const [users, setUsers] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const userPage = 10; // Số lượng người dùng trên mỗi trang

  const [searchTerm, setSearchTerm] = useState("");
  const filteredUsers = users.filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const navigate = useNavigate();

  // Hàm gọi API để lấy dasnh sách người dùng
  const fetchUsers = async () => {
    try {
      const responseUsers = await api.get("/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setUsers(responseUsers.data || []); // Cập nhật danh sách người dùng
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
      toaster.create({
        title: "Lỗi",
        description: "Không thể lấy danh sách người dùng.",
        type: "error",
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchUsers();
    }
  }, [accessToken]);

  // Hàm xử lý khi nhấn nút "Edit" trong bảng người dùng
  const handleEditUser = (user) => {
    navigate(`/admin/users/edit/${user._id}`); // Chuyển hướng đến trang chỉnh sửa người dùng
    // setSelectedUser(user); // Đặt người dùng được chọn vào state
  };

  // Phan trang
  const indexOfLast = currentPage * userPage;
  const indexOfFirst = indexOfLast - userPage;
  const currentUsers = filteredUsers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredUsers.length / userPage);

  return (
    <Flex h='100vh' bg='white'>
      <Box flex='1' p={6}>
        <VStack>
          <Heading size="lg" mb={4} w='full'>
            <HeaderAdmin
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />  
          </Heading>
          {/* Thông tin các tabs */}
          <Box 
            flex='1' 
            w='full'
          > 
            {/* Button add user */}
            <Button
              mb={4}
              color="white"
              bg="green.400"
              _hover={{ bg: "green.700" }}
              variant="subtle"
              onClick={() => {
                navigate("/admin/users/add"); // Chuyển hướng đến trang thêm người dùng
              }}
            >
              Thêm
            </Button>
            {/* Table User */}
              <TableUser  
                users={currentUsers}
                onEdit={handleEditUser}
                accessToken={accessToken}
                refreshUsers={fetchUsers}
              />
            {/* Change Page */}
              <Flex justifyContent="center" mt={4} gap={2}>
                {Array.from({length: totalPages}, (_, index) => (
                  <Button
                    key={index}
                    size="sm"
                    onClick={() => setCurrentPage(index + 1)}
                    variant={currentPage === index + 1 ? 'outline' : 'solid'}
                    bg={currentPage === index + 1 ? 'black' : ''}
                    colorScheme={currentPage === index + 1 ? "blue" : "gray"}
                  >
                    {index + 1}
                  </Button>
                ))}
              </Flex>

          </Box>  
        </VStack>
      </Box>
    </Flex>
  );
};


export default UserManagement;