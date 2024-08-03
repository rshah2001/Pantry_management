"use client";

import { useState, useEffect } from "react";
import { Box, Stack, Typography, Button, Modal, TextField } from "@mui/material";
import { firestore } from "@/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { quartersInYear } from "date-fns";
require("dotenv").config();

const API_KEY = process.env.NEXT_PUBLIC_SPOONACULAR_API_KEY; // Load API key from environment variables
console.log(API_KEY);
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "#333",
  border: "2px solid #FFD700",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  color: "#FFFFFF",
};

export default function PantryManagement() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [expiryDate, setExpiryDate] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [recipe, setRecipe] = useState([]);
  const [recipeDetails, setRecipeDetails] = useState(null);

  const updateInventory = async () => {
    const snapshot = collection(firestore, "inventory");
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data() });
    });
    setInventory(inventoryList);
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }
    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  const completelyRemoveItem = async (item) => {
    const docRef = doc(collection(firestore, "inventory"), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      await deleteDoc(docRef);
    }
    await updateInventory();
  };

  const addWithQuantity = async (item, quantity, expiryDate) => {
    if (!item || quantity <= 0) {
      return;
    }

    const docRef = doc(collection(firestore, "inventory"), item);
    try {
      await setDoc(docRef, { quantity: quantity, expiryDate: expiryDate });
      await updateInventory();
      handleClose(); // Clear the form and close modal
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setItemName("");
    setItemQuantity("1");
    setExpiryDate(null);
  };

  const handleEditOpen = (item) => {
    setSelectedItem(item);
    setItemName(item.name);
    setItemQuantity(item.quantity.toString());
    setExpiryDate(item.expiryDate);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setSelectedItem(null);
  };

  const updateItem = async () => {
    if (selectedItem) {
      const docRef = doc(collection(firestore, "inventory"), selectedItem.name);
      try {
        await setDoc(docRef, {
          quantity: parseInt(itemQuantity),
          expiryDate: expiryDate,
        });
        await updateInventory();
        handleEditClose(); // Close modal and clear selection
      } catch (error) {
        console.error("Error updating item:", error);
      }
    }
  };

  const generateRecipe = async () => {
    const items = inventory.map((item) => item.name).join(", ");

    try {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(
          items
        )}&apiKey=${API_KEY}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        setRecipe(data);
      } else {
        setRecipe([]);
        setRecipeDetails(null);
      }
    } catch (error) {
      console.error("Error generating recipe:", error);
    }
  };

  const fetchRecipeDetails = async (recipeId) => {
    try {
      const response = await fetch(
        `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`
      );
      const data = await response.json();
      setRecipeDetails(data);
      setDetailOpen(true);
    } catch (error) {
      console.error("Error fetching recipe details:", error);
    }
  };

  const handleDetailClose = () => {
    setDetailOpen(false);
    setRecipeDetails(null);
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      bgcolor="#2C2C2C"
      color="#FFFFFF"
      p={4}
      overflow="auto"
    >
      <Box width="100%" p={4} bgcolor="#1C1C1C" borderRadius={2} boxShadow={3}>
        <Typography variant="h2" color="#FFD700" textAlign="center" mb={4}>
          Pantry Items
        </Typography>
        <Stack spacing={2} mb={2}>
          {inventory.map(({ name, quantity, expiryDate }) => {
            const now = new Date();
            const expiry = expiryDate ? new Date(expiryDate) : null;
            let message = "";
            let color = "#FFFFFF"; // Default color

            if (expiry) {
              const msInDay = 1000 * 60 * 60 * 24;
              const daysDifference = Math.ceil((expiry - now) / msInDay);

              if (daysDifference < 0) {
                if (daysDifference === -1) {
                  message = "Expired Yesterday";
                } else {
                  message = "Expired";
                }
                color = "#FF5722"; // Red for expired items
              } else if (daysDifference === 0) {
                message = "Expiring Today";
                color = "#FFFF00"; // Yellow for expiring today
              } else if (daysDifference <= 2) {
                message = "Expiring Soon";
                color = "#FFFF00"; // Yellow for expiring soon
              }
            }

            return (
              <Box
                key={name}
                width="100%"
                display="flex"
                alignItems="center"
                bgcolor="#333"
                padding={2}
                borderRadius={1}
                justifyContent="space-between"
              >
                <Typography variant="h5" color="#FFD700">
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Typography>
                <Box flex="2" display="flex" justifyContent="center">
                  {message && (
                    <Typography variant="h6" color={color}>
                      {message}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    style={{
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#8B0000",
                      color: "#FFFFFF",
                    }}
                    onClick={() => removeItem(name)}
                  >
                    -
                  </Button>
                  <Typography variant="h5" color="#FFFFFF">
                    {quantity}
                  </Typography>
                  <Button
                    style={{
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#4CAF50",
                      color: "#FFFFFF",
                    }}
                    onClick={() => addItem(name)}
                  >
                    +
                  </Button>
                  <Button
                    style={{
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#FF9800",
                      color: "#FFFFFF",
                    }}
                    onClick={() => handleEditOpen({ name, quantity, expiryDate })}
                  >
                    Edit
                  </Button>
                  <Button
                    style={{
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#FF5722",
                      color: "#FFFFFF",
                    }}
                    onClick={() => completelyRemoveItem(name)}
                  >
                    Remove
                  </Button>
                </Stack>
              </Box>
            );
          })}
        </Stack>
        <Box display="flex" justifyContent="center" mt={4}>
          <Button variant="contained" onClick={handleOpen} style={{ marginRight: 8, backgroundColor: "#4A148C", color: "#FFFFFF" }}>
            Add Item
          </Button>
          <Button variant="contained" onClick={generateRecipe} style={{ backgroundColor: "#4A148C", color: "#FFFFFF" }}>
            Generate Recipe
          </Button>
        </Box>
      </Box>

      {recipe.length > 0 && (
        <Box width="100%" bgcolor="#1C1C1C" p={4} mt={4} borderRadius={2} boxShadow={3}>
          <Typography variant="h2" color="#FFD700" textAlign="center" mb={4}>
            Recipes
          </Typography>
          <Stack spacing={2}>
            {recipe.map((item) => (
              <Box
                key={item.id}
                width="100%"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                bgcolor="#333"
                p={2}
                borderRadius={1}
              >
                <Typography variant="h5" color="#FFD700">
                  {item.title}
                </Typography>
                <Button
                  style={{
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "#4CAF50",
                    color: "#FFFFFF",
                  }}
                  onClick={() => fetchRecipeDetails(item.id, item.quantity)}
                >
                  Details
                </Button>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {/* Add Item Modal */}
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2} textAlign="center">
            Add Item
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Item Name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              fullWidth
              InputLabelProps={{ style: { color: "#FFD700" } }}
              InputProps={{ style: { color: "#FFFFFF" } }}
            />
            <TextField
              label="Quantity"
              type="number"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
              fullWidth
              InputLabelProps={{ style: { color: "#FFD700" } }}
              InputProps={{ style: { color: "#FFFFFF" } }}
            />
            <TextField
              label="Expiry Date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true, style: { color: "#FFD700" } }}
              InputProps={{ style: { color: "#FFFFFF" } }}
            />
            <Button
              variant="contained"
              onClick={() => addWithQuantity(itemName, parseInt(itemQuantity), expiryDate)}
              style={{ backgroundColor: "#4A148C", color: "#FFFFFF" }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>

      {/* Edit Item Modal */}
      <Modal open={editOpen} onClose={handleEditClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" mb={2} textAlign="center">
            Edit Item
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Item Name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              fullWidth
              InputLabelProps={{ style: { color: "#FFD700" } }}
              InputProps={{ style: { color: "#FFFFFF" } }}
              disabled
            />
            <TextField
              label="Quantity"
              type="number"
              value={itemQuantity}
              onChange={(e) => setItemQuantity(e.target.value)}
              fullWidth
              InputLabelProps={{ style: { color: "#FFD700" } }}
              InputProps={{ style: { color: "#FFFFFF" } }}
            />
            <TextField
              label="Expiry Date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true, style: { color: "#FFD700" } }}
              InputProps={{ style: { color: "#FFFFFF" } }}
            />
            <Button
              variant="contained"
              onClick={updateItem}
              style={{ backgroundColor: "#4A148C", color: "#FFFFFF" }}
            >
              Update
            </Button>
          </Stack>
        </Box>
      </Modal>

      {/* Recipe Details Modal */}
      <Modal open={detailOpen} onClose={handleDetailClose} >
      <Box sx={{
        ...modalStyle,
        height : "80%",
        width :"50%",
        overflow :  "scroll"}}>
          <Typography variant="h6" mb={2} textAlign="center">
            Recipe Details
          </Typography>
          {recipeDetails && (
            <Box>
              <Typography variant="h5" mb={2}>
                {recipeDetails.title}
              </Typography>
              <img src={recipeDetails.image} alt={recipeDetails.title} style={{ width: "100%", borderRadius: 4, marginBottom: 8 }} />
              <Typography variant="body1" mb={2} >
                {recipeDetails.instructions}
              </Typography>
              <Typography variant="body1" mb={2} >
                Ready in {recipeDetails.readyInMinutes} minutes
              </Typography>
              <Typography variant="body1" mb={2} >
                Servings: {recipeDetails.servings}
              </Typography>
              <Button
                variant="contained"
                onClick={handleDetailClose}
                style={{ backgroundColor: "#4A148C", color: "#FFFFFF" }}
              >
                Close
              </Button>
            </Box>
          )}
        </Box>
      </Modal>
    </Box>
  );
}
