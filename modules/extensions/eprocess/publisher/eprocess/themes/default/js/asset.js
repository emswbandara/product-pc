   /*
 * Copyright (c) WSO2 Inc, 2014. (http://wso2.com) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

$(function () {
    var $tab = $('#tab-reviews');
    $('a').click(function(){
        var tab = $(this).data("type");
        if(tab=="comments"){
            $tab.css({position:'static', visibility:'visible'});
        }else{
            $tab.css({position:'static', visibility:'hidden'});
        }
    });

    var SOCIAL_CONTAINER_ID='#socialIfr';
    var SOCIAL_PARAM_SCRIPT_TYPE='scriptType';
    var SOCIAL_PARAM_SCRIPT='script';

    if (isSocial) {
        var script = document.createElement('script');
        script.type = $(SOCIAL_CONTAINER_ID).data(SOCIAL_PARAM_SCRIPT_TYPE);
        script.src = $(SOCIAL_CONTAINER_ID).data(SOCIAL_PARAM_SCRIPT);

        document.body.appendChild(script);
    } else {
        var comments = {
                interval: 5 * 1000,
                commentsUrl: caramel.context + '/apis/comments?asset=' + $('#assetp-tabs').data('aid') + '&page=',
                pagingUrl: '/apis/comments/paging?page=',
                partial: '/themes/store/partials/comments.hbs'
            },
            paging = {
                current: 1,
                partial: '/themes/store/partials/pagination.hbs'
            };

        $tab.on('click', '.pagination a', function (e) {
            e.preventDefault();
            var page,
                thiz = $(this),
                str = thiz.text(),
                url = thiz.attr('href');
            if (url === '#') {
                return;
            }
            if (str.indexOf('Next') !== -1) {
                page = paging.current + 1;
            } else if (str.indexOf('Prev') !== -1) {
                page = paging.current - 1
            } else {
                page = parseInt(str, 10);
            }
            loadReviews(url, page);
        });

        var loadReviews = function (url, page) {
            var iframe, iframeHeight,
                el = $('#tab-reviews').find('.content');
            comments.updated = new Date().getTime();
            async.parallel({
                comments: function (callback) {
                    $.get(url, function (data) {
                        callback(null, data);
                    }, 'json');
                },
                paging: function (callback) {
                    caramel.post(comments.pagingUrl + page, {
                        asset: $('#assetp-tabs').data('aid')
                    }, function (data) {
                        paging.current = data.current;
                        callback(null, data);
                    }, 'json');
                }
            }, function (error, result) {
                if (error) {
                    theme.loaded(el, '<p>Error while retrieving data.</p>')
                } else {
                    async.parallel({
                        comments: function (callback) {
                            var i, comment,
                                comments = result.comments,
                                length = comments.length;
                            for (i = 0; i < length; i++) {
                                comment = comments[i];
                                comment.created.time = moment(comment.created.time).format('LL');
                            }
                            caramel.render('comments', {
                                user: store.user,
                                comments: comments
                            }, callback);
                        },
                        paging: function (callback) {
                            caramel.render('pagination', result.paging, callback);
                        }
                    }, function (err, result) {
                        theme.loaded(el, result.comments);
                        el.append(result.paging);

                        iframe = $('#tab-reviews').find('iframe');
                        iframeHeight = iframe.contents().height();
                        iframe.height(iframeHeight);
                    });
                }
                $('#assetp-tabs').tab();
            });
            theme.loading(el);
        };

        $('#assetp-tabs').on('click', 'a[href="#tab-reviews"]',function (e) {
            var thiz = $(this),
                current = new Date().getTime();
            e.preventDefault();
            if (!comments.interval || (current - (comments.updated || 0) < comments.interval)) {
                thiz.tab('show');
                return;
            }
            loadReviews(comments.commentsUrl + paging.current, paging.current);
            thiz.tab('show');
        }).on('click', 'a[href="#tab-properties"]', function (e) {

            });

        $('#tab-review-box').find('.btn-primary').live('click', function (e) {
            if (!$("#form-review").valid()) return;
            caramel.post('/apis/comment', {
                asset: $('#assetp-tabs').data('aid'),
                content: $('#tab-review-box').find('.content').val()
            }, function (data) {
                loadReviews(comments.commentsUrl + paging.current, paging.current);
            }, 'json');
        });

        $('.text-review-box').live('keyup focus', function (e) {
            if ($('#comment-content').hasClass('user-review')) {
                $(".btn-review").removeClass("btn-primary");
                $(".btn-review").addClass("disabled");
                $('.text-review-box-charCount-msg').hide();
                $('.error-text').show();
                return false;
            }
            var chars = this.value.length;
            $('.text-review-box-charCount-msg').show();
            var limit = 490;
            if (chars > limit) {
                src.value = src.value.substr(0, limit);
                chars = limit;
            }
            $("#charCount").html(limit - chars);
            return false;

        });


    }
    $('#btn-add-gadget').click(function () {
        var elem = $(this);
        asset.process(elem.data('type'), elem.data('aid'), location.href);
    });

    $("a[data-toggle='tooltip']").tooltip();

    $('.embed-snippet').hide();

    $('.btn-embed').click(function () {
        $('.embed-snippet').toggle(400);
        return false;
    });

    var el = $('.user-rating'),
        rating = el.data('rating');
    $($('input', el)[rating - 1]).attr('checked', 'checked');

    $('.auto-submit-star').rating({
        callback: function (value, link) {
            if (value == undefined) {
                value = 0;
            }
            $('.rate-num-assert').html('(' + value + ')');
            caramel.post('/apis/rate', {
                asset: $('#assetp-tabs').data('aid'),
                value: value || 0
            }, function (data) {

            });
        }
    });

});
