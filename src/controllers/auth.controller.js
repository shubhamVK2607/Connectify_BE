import generateToken from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  try {
    const { email, password, fullName, photoURL } = req.body;
    
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must have atleast 6 characters" });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Email already exist" });
    }

    // Only upload to Cloudinary if photoURL is provided
    let profilePhotoURL = null;
    if (photoURL) {
      const uploadResponse = await cloudinary.uploader.upload(photoURL);
      profilePhotoURL = uploadResponse.secure_url;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      fullName,
      password: hashedPassword,
      photoURL: profilePhotoURL  // Will be null if not provided
    });

    if (newUser) {
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        photoURL: newUser.photoURL,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid Credential" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid Credential" });
    }

    await generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      photoURL: user.photoURL,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server Error" });
  }
};
export const logout = (req, res) => {
  res.cookie("token", "", { maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully" });
};

export const updateProfile = async (req, res) => {
  try {
    const profilePic = req.body.photoURL;
    const userId = req.user._id;
    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { photoURL: uploadResponse.secure_url },
      { new: true }
    );
    res.status(201).json(updatedUser);
  } catch (error) {
    console.log("ERROR is update profile " + error.message);
    return res.status(500).json({ message: "Internal server Error" });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const { user } = req;
    res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Internal server Error" });
  }
};
