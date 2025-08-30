import { createApp } from "./index.js";
import { UserModel } from "./model/supabase/users.js";
import { FriendShipModel } from "./model/supabase/friendShip.js"
createApp({ UserModel, FriendShipModel });