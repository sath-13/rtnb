import User from "../models/user-model.js";
import Admin from "../models/SuperAdmin-model.js";

export const getMonthlyAnniversaries = async (req, res) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();
    const currentYear = today.getFullYear();

    const isAnniversaryThisMonth = (createdAt) => {
      const created = new Date(createdAt);
      const yearsCompleted = currentYear - created.getFullYear();
      return created.getMonth() === currentMonth && yearsCompleted >= 1;
    };

    const mapAnniversaryData = (person, role) => {
      const created = new Date(person.createdAt);
      const yearsCompleted = currentYear - created.getFullYear();
      const isToday = created.getDate() === currentDate;
      return {
        name: `${person.fname} ${person.lname}`,
        joiningDate: created.toDateString(),
        yearsCompleted,
        role,
        isToday,
        userLogo: person.userLogo || null,
      };
    };

    const users = await User.find({ status: "active" });
    const admins = await Admin.find({ status: "active" });

    const userAnniversaries = users
      .filter(user => isAnniversaryThisMonth(user.createdAt))
      .map(user => mapAnniversaryData(user, "User"));

    const adminAnniversaries = admins
      .filter(admin => isAnniversaryThisMonth(admin.createdAt))
      .map(admin => mapAnniversaryData(admin, "Admin"));

    const all = [...userAnniversaries, ...adminAnniversaries];

    const todayAnniversaries = all.filter(person => person.isToday);
    const upcomingAnniversaries = all.filter(person => !person.isToday);

    res.status(200).json({ today: todayAnniversaries, upcoming: upcomingAnniversaries });
  } catch (err) {
    console.error("Error fetching anniversaries:", err);
    res.status(500).json({ message: "Server error" });
  }
};

