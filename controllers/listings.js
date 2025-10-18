const Listing = require("../models/listing");

module.exports.index = async (req, res, next) => {
  let allListing = await Listing.find().sort({ _id: -1 });
  res.render("listings/index.ejs", { allListing });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.createListing = async (req, res, next) => {
  try {
    // Extract image details from uploaded file
    const url = req.file.path;
    const filename = req.file.filename;

    // Create a new listing from form data
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    // Save listing (no geometry)
    await newListing.save();

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
  } catch (err) {
    next(err);
  }
};

module.exports.showListing = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listing) {
    req.flash("error", "Listing you requested for does not exist!");
    res.redirect("/listings");
  }
  console.log(listing);
  res.render("listings/show.ejs", { listing });
};

module.exports.renderEditForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing you requested for does not exist!");
      return res.redirect("/listings");
    }

    // Prepare original image for preview (optional resizing if needed)
    let originalImage = listing.image?.url || "/Icon/listing-img-pre.png";

    res.render("listings/edit.ejs", { listing, originalImage });
  } catch (err) {
    next(err);
  }
};


module.exports.updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateListing = req.body.listing;

    // Update listing fields
    const listing = await Listing.findByIdAndUpdate(id, updateListing, { new: true });

    // Update image if a new file is uploaded
    if (req.file) {
      listing.image = {
        url: req.file.path,
        filename: req.file.filename,
      };
      await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err);
  }
};


module.exports.destroyListing = async (req, res, next) => {
  let { id } = req.params;
  let deleteListing = await Listing.findByIdAndDelete(id);
  console.log(deleteListing);
  req.flash("success", "Listing Deleted!");
  console.log("delete");
  res.redirect("/listings");
};

module.exports.filter = async (req, res, next) => {
  let { id } = req.params;
  let allListing = await Listing.find({ category: { $all: [id] } });
  console.log(allListing);
  if (allListing.length != 0) {
    res.locals.success = `Listings Find by ${id}`;
    res.render("listings/index.ejs", { allListing });
  } else {
    req.flash("error", "Listings is not here !!!");
    res.redirect("/listings");
  }
};

module.exports.filterbtn = (req, res, next) => {
  res.render("listings/filterbtn.ejs");
};

module.exports.search = async (req, res) => {
  console.log(req.query.q);
  let input = req.query.q.trim().replace(/\s+/g, " "); // remove start and end space and middle space remove and middle add one space------
  console.log(input);
  if (input == "" || input == " ") {
    //search value empty
    req.flash("error", "Search value empty !!!");
    res.redirect("/listings");
  }

  // convert every word 1st latter capital and other small---------------
  let data = input.split("");
  let element = "";
  let flag = false;
  for (let index = 0; index < data.length; index++) {
    if (index == 0 || flag) {
      element = element + data[index].toUpperCase();
    } else {
      element = element + data[index].toLowerCase();
    }
    flag = data[index] == " ";
  }
  console.log(element);

  let allListing = await Listing.find({
    title: { $regex: element, $options: "i" },
  });
  if (allListing.length != 0) {
    res.locals.success = "Listings searched by Title";
    res.render("listings/index.ejs", { allListing });
    return;
  }
  if (allListing.length == 0) {
    allListing = await Listing.find({
      category: { $regex: element, $options: "i" },
    }).sort({ _id: -1 });
    if (allListing.length != 0) {
      res.locals.success = "Listings searched by Category";
      res.render("listings/index.ejs", { allListing });
      return;
    }
  }
  if (allListing.length == 0) {
    allListing = await Listing.find({
      country: { $regex: element, $options: "i" },
    }).sort({ _id: -1 });
    if (allListing.length != 0) {
      res.locals.success = "Listings searched by Country";
      res.render("listings/index.ejs", { allListing });
      return;
    }
  }
  if (allListing.length == 0) {
    let allListing = await Listing.find({
      location: { $regex: element, $options: "i" },
    }).sort({ _id: -1 });
    if (allListing.length != 0) {
      res.locals.success = "Listings searched by Location";
      res.render("listings/index.ejs", { allListing });
      return;
    }
  }
  const intValue = parseInt(element, 10); // 10 for decimal return - int ya NaN
  const intDec = Number.isInteger(intValue); // check intValue is Number & Not Number return - true ya false

  if (allListing.length == 0 && intDec) {
    allListing = await Listing.find({ price: { $lte: element } }).sort({
      price: 1,
    });
    if (allListing.length != 0) {
      res.locals.success = `Listings searched for less than Rs ${element}`;
      res.render("listings/index.ejs", { allListing });
      return;
    }
  }
  if (allListing.length == 0) {
    req.flash("error", "Listings is not here !!!");
    res.redirect("/listings");
  }
};
