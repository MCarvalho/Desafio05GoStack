import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import api from '../../services/api';
import Container from '../../components/Container';
import {
  Loading,
  Owner,
  IssueList,
  Filters,
  ButtonFilter,
  Pages,
} from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    page: 1,
    filters: [
      {
        state: 'all',
        name: 'All',
        activated: true,
      },
      {
        state: 'open',
        name: 'Open',
        activated: false,
      },
      {
        state: 'closed',
        name: 'Closed',
        activated: false,
      },
    ],
  };

  async componentDidMount() {
    const { match } = this.props;
    const { page } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      this.getIssues(repoName, page),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  async getIssues(repoName, page) {
    const { filters } = this.state;

    return api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filters.find(f => f.activated === true).state,
        page,
      },
    });
  }

  handleAlterPage = async e => {
    const { repository, page } = this.state;

    const newPage = page + e;

    this.setState({
      loading: true,
    });

    const issues = await this.getIssues(repository.full_name, newPage);

    this.setState({ issues: issues.data, loading: false, page: newPage });
  };

  handleClickFilter = async state => {
    const { repository, filters } = this.state;

    const page = 1;

    this.setState({
      loading: true,
    });

    filters.forEach(filter => {
      filter.activated = filter.state === state;
    });

    this.setState({ filters });

    const issues = await this.getIssues(repository.full_name, page);

    this.setState({ issues: issues.data, loading: false, page });
  };

  render() {
    const { repository, loading, issues, filters, page } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <Filters>
          {filters.map(filter => (
            <ButtonFilter
              key={filter.state}
              activated={filter.activated}
              onClick={() => this.handleClickFilter(filter.state)}
              disabed={loading}
            >
              {filter.name}
            </ButtonFilter>
          ))}
        </Filters>

        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>

        <Pages>
          <button
            onClick={() => this.handleAlterPage(-1)}
            type="button"
            disabled={page < 2 || loading}
          >
            <FiArrowLeft />
          </button>
          <button
            onClick={() => this.handleAlterPage(1)}
            type="button"
            disabed={loading}
          >
            <FiArrowRight />
          </button>
        </Pages>
      </Container>
    );
  }
}
