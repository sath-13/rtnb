import config from "./config.js";
import server from "./app.js";
import connectDb from "./config/db.js";
import TypeOfWork from "./models/TypeOfWorkModel.js";

const start = async () => {
	try {
		await connectDb();
		await TypeOfWork.ensureDefaults();
		server.listen(config.PORT, () =>
			console.log(`Server is listening on port ${config.PORT}...`)
		);
	} catch (error) {
		console.error(error);
	}
};

start();
