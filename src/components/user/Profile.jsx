import {
  Box,
  VStack,
  Flex,
  Text,
  Button,
  Input,
  Heading,
  Spinner,
  Alert,
  Avatar,
  Badge,
  Field
} from "@chakra-ui/react";

import { Dialog, Portal } from "@chakra-ui/react";
import { Toaster, toaster } from '@/components/ui/toaster';
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router';
import api from "@/api";
import { useAtom } from "jotai";
import { accessTokenAtom, logoutAtom } from "@/atoms/authAtom.js";
import { userAtom, formDataAtom } from "@/atoms/userAtom";

const ProfilePage = () => {
  const [user, setUser] = useAtom(userAtom);
  const [accessToken] = useAtom(accessTokenAtom);
  const [, logout] = useAtom(logoutAtom);
  
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useAtom(formDataAtom)
  
  const [loading, setLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  
  // For delete account modal
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!accessToken) {
          navigate('/login', { state: { error: "Please login to continue" } });
          return;
        }
        
        setLoading(true);
        const response = await api.get('/user/me', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (response.data.success) {
          const userData = response.data.data;
          setUser(userData);
          setFormData({
            username: userData.username || '',
            email: userData.email || '',
            fullName: userData.fullName || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        } else {
          throw new Error(response.data.message || "Failed to load user data");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error.message);
        toaster.create({
          title: "Error",
          description: "Failed to load your profile information. Please try again.",
          type: "error",
          duration: 3000,
          isClosable: true,
        });
        
        if (error.response?.status === 401) {
          await logout();
          navigate("/login", { state: { error: "Session expired, please login again" } });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [accessToken, navigate, logout, setUser]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
    
    // Clear success message when user starts changing data again
    if (updateSuccess) {
      setUpdateSuccess(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Username validation
    if (formData.username.trim().length < 4) {
      newErrors.username = "Username must be at least 4 characters";
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Password validation (only if user is trying to change password)
    if (showPasswordSection) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = "Current password is required";
      }
      
      const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
      if (!re.test(formData.newPassword)) {
        newErrors.newPassword = "Password must be at least 8 characters with uppercase, lowercase, and number.";
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords don't match";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setUpdateLoading(true);
      
      const payload = {
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
      };
      
      // Add password data if the user is updating password
      if (showPasswordSection && formData.currentPassword && formData.newPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }
      
      const response = await api.put('/user/update-profile', payload, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.data.success) {
        // Update local user state
        setUser({
          ...user,
          username: formData.username,
          email: formData.email,
          fullName: formData.fullName,
        });
        
        // Reset password fields
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        setShowPasswordSection(false);
        setUpdateSuccess(true);
        
        toaster.create({
          title: "Success",
          description: "Your profile has been updated successfully",
          type: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error.response?.data || error.message);
      
      // Handle specific errors
      if (error.response?.data?.field) {
        setErrors({
          ...errors,
          [error.response.data.field]: error.response.data.message
        });
      } else {
        toaster.create({
          title: "Update Failed",
          description: error.response?.data?.message || "Failed to update your profile. Please try again.",
          type: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toaster.create({
        title: "Error",
        description: 'Please type "DELETE" to confirm',
        type: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      setDeleteLoading(true);
      
      const response = await api.delete('/user/delete-account', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.data.success) {
        toaster.create({
          title: "Account Deleted",
          description: "Your account has been deleted successfully.",
          type: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // Logout the user
        await logout();
        navigate("/login", { state: { message: "Your account has been deleted" } });
      } else {
        throw new Error(response.data.message || "Failed to delete account");
      }
    } catch (error) {
      console.error("Error deleting account:", error.response?.data || error.message);
      
      toaster.create({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete your account. Please try again.",
        type: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setDeleteLoading(false);
      // onClose();
      setDeleteConfirmation('');
    }
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minH="100vh" bg="gray.50">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading your profile...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box display="flex" position="relative" minH="100vh" bg="gray.50" pt={10}>
      <Toaster />
      
      <Box w="full" maxW="800px" mx="auto" p={2}>
        <VStack spacing={4} align="stretch">
          <Flex direction="column" align="center">
            <Avatar.Root
              size="2xl" 
              name={formData.fullName || formData.username}
              bg="blue.500" 
              color="white"
              mb={4}
            />
            <Heading size="lg" mb={2} textAlign="center">
              {user?.fullName}
            </Heading>
          </Flex>
          
          <form onSubmit={handleSubmit}>
            <VStack spacing={6} align="stretch" bg="white" p={6} borderRadius="lg" boxShadow="sm">
              <Heading size="md" mb={2} textAlign="center">Account Information</Heading>
              <Field.Root orientation="horizontal" isInvalid={errors.username}>
                <Field.Label>Username</Field.Label>
                <Input 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                />
                {errors?.username && <Badge colorPalette="red">{errors?.username}</Badge>}
              </Field.Root>
              <Field.Root orientation="horizontal"  isInvalid={errors.email} readOnly>
                <Field.Label>Email</Field.Label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
                {errors?.email && <Badge colorPalette="red">{errors?.email}</Badge>}
              </Field.Root>
              <Field.Root orientation="horizontal" isInvalid={errors.fullName} >
                <Field.Label>Name</Field.Label>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
                {errors?.fullName && <Badge colorPalette="red">{errors?.fullName}</Badge>}
              </Field.Root>
              
              <Box pt={4}>
                <Button
                  variant="link"
                  color="blue.500"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                  mb={4}
                >
                  {showPasswordSection ? "Hide Password Change" : "Change Password"}
                </Button>
                
                {showPasswordSection && (
                  <VStack spacing={4} align="stretch" mt={2} p={4} bg="gray.50" borderRadius="md">
                    <Heading size="sm" mb={2} textAlign="center">Change Password</Heading>
                    
                    <Field.Root orientation="horizontal"  isInvalid={errors.currentPassword}>
                      <Field.Label>Current Password</Field.Label>
                      <Input
                        name="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        placeholder="Enter your current password"
                      />
                      {errors?.currentPassword && <Badge colorPalette="red">{errors?.currentPassword}</Badge>}
                    </Field.Root>
                    <Field.Root orientation="horizontal"  isInvalid={errors.newPassword}>
                      <Field.Label>New Password</Field.Label>
                      <Input
                        name="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="Enter new password"
                      />
                      {errors.newPassword && <Badge colorPalette="red">{errors.newPassword}</Badge>}
                    </Field.Root>
                    <Field.Root orientation="horizontal"  isInvalid={errors.confirmPassword}>
                      <Field.Label>Confirm</Field.Label>
                      <Input
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Confirm new password"
                        />
                        {errors.confirmPassword && <Badge colorPalette="red">{errors.confirmPassword}</Badge>}
                    </Field.Root>
                  </VStack>
                )}
              </Box>
              
              <Flex mt={2}>
                <Button 
                  marginEnd="auto"
                  bg="blue.500"
                  onClick={() => navigate("/video/create")}
                >
                  Home
                </Button>
                <Dialog.Root>
                  <Dialog.Trigger asChild>
                    <Button
                      mx="4"
                      colorScheme="red"
                      variant="outline"
                      color="white"
                      bg="red.600"
                      // onClick={onOpen}
                    >
                      Delete Account
                  </Button>
                  </Dialog.Trigger>
                  <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                      <Dialog.Content>
                        <Dialog.Header>
                          <Dialog.Title>Delete Account</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                          <VStack spacing={4} align="stretch">
                            <Alert.Root status="error" borderRadius="md">
                              <Alert.Indicator  />
                              <Box>
                                <Alert.Title>Warning: This Action Cannot Be Undone</Alert.Title>
                                <Alert.Description>
                                  Deleting your account will permanently remove all your data, including your profile, videos, and settings.
                                </Alert.Description>
                              </Box>
                            </Alert.Root>
                            
                            <Text fontWeight="medium">
                              Please type DELETE to confirm:
                            </Text>
                            <Input
                              value={deleteConfirmation}
                              onChange={(e) => setDeleteConfirmation(e.target.value)}
                              placeholder='Type "DELETE" to confirm'
                            />
                          </VStack>
                        </Dialog.Body>
                        <Dialog.Footer>
                          <Dialog.ActionTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                          </Dialog.ActionTrigger>
                          <Button
                            colorScheme="red"
                            onClick={handleDeleteAccount}
                            isLoading={deleteLoading}
                            loadingText="Deleting"
                            isDisabled={deleteConfirmation !== "DELETE"}
                          >
                            Delete
                          </Button>
                        </Dialog.Footer>
                      </Dialog.Content>
                    </Dialog.Positioner>
                  </Portal>
                </Dialog.Root>
                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={updateLoading}
                  loadingText="Updating"
                >
                  Save Changes
                </Button>
              </Flex>
            </VStack>
          </form>
        </VStack>
      </Box>
      
    </Box>
  );
};

export default ProfilePage;