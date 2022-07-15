db.streamer.updateMany(
    {demoted: true},
    {
        $set: {
            "approval.granted": true,
            "demoted": false
        }
    }
);