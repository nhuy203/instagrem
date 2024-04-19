const Post = require('../models/Post')
const Like = require('../models/Like')
const Comment = require('../models/Comment')

class CommentController {

    // @route [POST] /comment/p/:post_id
    // @desc comment post
    // @access Private
    async createComment(req, res) {
        const { post_id } = req.params
        const { comment } = req.body
        const me = req.userId

        try {
            // check if post exists
            const post = await Post.findById(post_id)
            if (!post) {
                return res.status(404).json({ success: false, message: 'Post not found' })
            }

            // add comment to db
            const newComment = new Comment({
                comment,
                post_id,
                user_id: me
            })
            await newComment.save()

            // increment comment count
            const postAfter = await Post.findByIdAndUpdate(
                post_id,
                { $inc: { comments_count: 1 } },
                { new: true }
            )

            res.json({
                success: true, message: 'Commented post !',
                comment: newComment,
                post: postAfter
            })
        } catch (error) {
            console.error('Error createComment function in CommentController: ', error)
            return res.status(500).json({ error: 'Internal Server Error' })
        }
    }


    // @route [POST] /comment/c/:parent_id
    // @desc reply comment 
    // @access Private
    async createCommentReply(req, res) {
        const { parent_id } = req.params
        const { comment } = req.body
        const me = req.userId

        try {
            // check if comment exists
            const parentComment = await Comment.findById(parent_id)
            if (!parentComment) {
                return res.status(404).json({ success: false, message: 'Comment not found' })
            }

            // add comment to db
            const newComment = new Comment({
                comment,
                post_id: parentComment.post_id,
                user_id: me,
                parent_id,
            })
            await newComment.save()

            // increment comment count
            const postAfter = await Post.findByIdAndUpdate(
                parentComment.post_id,
                { $inc: { comments_count: 1 } },
                { new: true }
            )

            res.json({
                success: true, message: 'Replied Comment !',
                comment: newComment,
                post: postAfter
            })
        } catch (error) {
            console.error('Error createCommentReply function in CommentController: ', error)
            return res.status(500).json({ error: 'Internal Server Error' })
        }
    }


    // @route [DELETE] /comment/:comment_id
    // @desc delete comment 
    // @access Private
    async deleteComment(req, res) {
        const { comment_id } = req.params
        const me = req.userId

        try {
            // delete comment
            const deleteCommentCondition = { _id: comment_id, user_id: me }
            const deletedComment = await Comment.findOneAndDelete(deleteCommentCondition)

            if (!deletedComment) {
                return res.status(401).json({ success: false, message: 'Could not delete comment' })
            }

            // delete all reply comment if this is parent
            const deletedChildComments = await Comment.deleteMany({ parent_id: comment_id })

            // update post comments_count
            const decrementCount = -(1 + deletedChildComments.deletedCount)

            const postAfter = await Post.findByIdAndUpdate(
                deletedComment.post_id,
                { $inc: { comments_count: decrementCount } },
                { new: true }
            )

            res.status(200).json({
                success: true, message: 'Deleted comment !',
                comment: deletedComment,
                childComment: deletedChildComments,
                post: postAfter
            })
        } catch (error) {
            console.error('Error deleteComment function in CommentController: ', error)
            return res.status(500).json({ error: 'Internal Server Error' })
        }
    }

}

module.exports = new CommentController()