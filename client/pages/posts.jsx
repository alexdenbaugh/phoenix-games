import React from 'react';
import AppContext from '../lib/app-context';
import debounce from '../lib/debounce';
import Redirect from '../components/redirect';

export default class Posts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchStatus: 'empty',
      searchValue: '',
      recentPosts: [],
      searchedPosts: []
    };
    this.requests = new Set();
    this.handleType = this.handleType.bind(this);
    this.renderView = this.renderView.bind(this);
    this.runSearch = debounce(this.runSearch.bind(this), 500);
    this.renderSearch = this.renderSearch.bind(this);
  }

  componentDidMount() {
    const requestController = new AbortController();
    this.requests.add(requestController);
    const { signal } = requestController;
    fetch('/api/boardGamePosts', { signal })
      .then(response => response.json())
      .then(postInfo => {
        if (signal.aborted) return;
        const recentPosts = postInfo.slice();
        this.setState({ recentPosts });
      })
      .catch(() => {})
      .finally(() => this.requests.delete(requestController));
  }

  componentWillUnmount() {
    this.requests.forEach(req => req.abort());
  }

  handleType(event) {
    if (event.target.value !== this.state.searchValue) {
      this.setState({ searchValue: event.target.value }, this.runSearch);
    }
  }

  runSearch() {
    const { searchValue } = this.state;
    if (this.state.searchValue.length > 0) {
      this.setState({ searchStatus: 'searching' });
      const requestController = new AbortController();
      this.requests.add(requestController);
      const { signal } = requestController;
      const currentSearch = this.activeSearch = fetch(`/api/boardGamePosts/search/${searchValue}`, { signal })
        .then(response => response.json())
        .then(posts => {
          if (signal.aborted) return;
          if (this.activeSearch !== currentSearch) return;
          if (posts.error || posts.length < 1) {
            this.setState({ searchStatus: 'none' });
          } else {
            this.setState({ searchedPosts: posts, searchStatus: 'result' });
          }
        })
        .catch(() => { })
        .finally(() => this.requests.delete(requestController));
    } else {
      this.setState({ searchStatus: 'empty' });
    }
  }

  renderSearch() {
    if (this.state.searchStatus === 'none') {
      return (
        <div className="row search-message">
          <h3 className="orange">No posts were found, try again</h3>
        </div>
      );
    } else if (this.state.searchStatus === 'searching') {
      return (
        <div className="row search-message">
          <h3 className="orange">Searching...</h3>
        </div>
      );
    } else if (this.state.searchStatus === 'result') {
      return (
        <>
          <PostingList postList={this.state.searchedPosts} showPost={this.showPost} />
        </>
      );
    }
  }

  renderView() {
    if (this.context.route.path === 'posts') {
      return (
        <>
          <div className="row row-2 post-search-bar">
            <a href="#post-search" className="search-input shadow col-2">
              <div className="search-icon">
                <label htmlFor="search-bar-postings-view"><i className="orange fas fa-search"></i></label>
              </div>
              <input data-view="search" readOnly type="text" className="lora" id="search-bar-postings-view" placeholder="Search for a game..." />
            </a>
          </div>
          <div className="row">
            <div className="col-4 bookmark title shadow">
              <h1 className="text-shadow orange">Postings</h1>
            </div>
          </div>
          <div className="postings-container">
            <PostingList postList={this.state.recentPosts} showPost={this.showPost} />
          </div>
        </>
      );
    } else if (this.context.route.path === 'post-search') {
      return (
        <>
          <div className="row row-2 post-search-bar">
            <div className="search-input shadow col-2">
              <div className="search-icon">
                <label htmlFor="search-bar-search-view"><i className="orange fas fa-search"></i></label>
              </div>
              <input autoFocus autoComplete="off" onKeyUp={this.handleType} type="text" className="lora" id="search-bar-search-view" placeholder="Search for a game..." />
            </div>
          </div>
          <div className="postings-container">
            {this.renderSearch()}
          </div>
        </>
      );
    }
  }

  render() {
    if (!this.context.user) return <Redirect to="sign-in" />;

    return (
      <>
        { this.renderView()}
      </>
    );
  }
}

Posts.contextType = AppContext;

function PostingList(props) {
  if (props.postList.length < 1) {
    return (<></>);
  } else {
    const $postList = props.postList.map(post => {
      return (
        <PostItem key={post.postId} info={post} showPost={props.showPost} />
      );
    });
    return (
      <div className="row row-2 post-list">
        { $postList}
      </div>
    );
  }
}

function PostItem(props) {
  const {
    gameName: game,
    lenderName: name,
    image,
    postId
  } = props.info;
  return (
    <a href={`#post-info?postId=${postId}`} className="post-item">
      <div className="post-item-info">
        <div>
          <h3 className="orange shadow post-item-info-title">Title</h3>
        </div>
        <div>
          <h3 className="lora post-item-info-value">{game}</h3>
        </div>
        <div>
          <h3 className="orange shadow post-item-info-title">Lender</h3>
        </div>
        <div>
          <h3 className="lora post-item-info-value">{name}</h3>
        </div>
      </div>
      <div className="post-item-img">
        <img src={image} alt={game} />
      </div>
    </a>
  );
}
