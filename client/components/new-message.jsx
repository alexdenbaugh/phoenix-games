import React from 'react';

export default class NewMessage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      post: null,
      message: ''
    };
    this.requests = new Set();
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    const { postId } = this.props;
    const requestController = new AbortController();
    this.requests.add(requestController);
    const { signal } = requestController;
    fetch(`/api/boardGamePosts/${postId}`)
      .then(response => response.json())
      .then(post => {
        if (signal.aborted) return;
        this.setState({ post });
      })
      .catch(() => { })
      .finally(() => this.requests.delete(requestController));
  }

  componentWillUnmount() {
    this.requests.forEach(req => req.abort());
  }

  handleChange(event) {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  }

  handleSubmit(event) {
    event.preventDefault();
    const { message, post } = this.state;
    const { postId, user: { username } } = this.props;
    const token = window.localStorage.getItem('phoenix-games-jwt');
    const requestController = new AbortController();
    this.requests.add(requestController);
    const { signal } = requestController;
    const header = new Headers();
    header.append('Content-Type', 'application/json');
    header.append('phoenix-games-jwt', token);
    let body = {
      senderName: username,
      recipientId: post.lenderId,
      content: message,
      postId
    };
    body = JSON.stringify(body);
    const init = {
      method: 'POST',
      headers: header,
      body: body,
      signal
    };
    fetch('/api/messages', init)
      .then(response => response.json())
      .then(message => {
        if (signal.aborted) return;
        this.setState({ post: null }, this.props.handleHeader);
      })
      .catch(() => { })
      .finally(() => this.requests.delete(requestController));
  }

  render() {
    if (!this.state.post) {
      return null;
    }
    const { handleHeader } = this.props;
    const { lenderName } = this.state.post;
    return (
      <form onSubmit={this.handleSubmit} className="shadow new-message-container" data-view="new-message">
        <div className="text-shadow row new-message-textarea" data-view="new-message">
          <div>
            <label className="text-shadow orange" htmlFor="new-message" data-view="new-message">{`New message for ${lenderName}...`}</label>
          </div>
          <textarea value={this.state.message} onChange={this.handleChange} className="lora" required name="message" id="new-message" cols="30" rows="10" data-view="new-message"></textarea>
        </div>
        <div className="row new-message-buttons" data-view="new-message">
          <button type="button" onClick={handleHeader} className="cancel-button text-shadow shadow">Cancel</button>
          <button type="submit" onClick={handleHeader} className="text-shadow shadow" data-view="new-message">Send</button>
        </div>
      </form>
    );
  }
}
